// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  calculateBackoffWithJitter,
  DEFAULT_BACKOFF_DELAYS,
  swrRetryWithBackoff,
} from "./retryBackoff";

describe("calculateBackoffWithJitter", () => {
  it("uses first backoff step for failureCount 0", () => {
    const delay = calculateBackoffWithJitter(0, [10_000, 20_000], 0);
    expect(delay).toBe(10_000);
  });

  it("caps backoff index at the maximum delay step", () => {
    const delay = calculateBackoffWithJitter(10, [10_000, 20_000, 30_000], 0);
    expect(delay).toBe(30_000);
  });

  it("adds jitter up to maxJitter", () => {
    const delay = calculateBackoffWithJitter(0, [10_000], 500);
    expect(delay).toBeGreaterThanOrEqual(10_000);
    expect(delay).toBeLessThan(10_500);
  });

  it("works with default parameters", () => {
    const delay = calculateBackoffWithJitter(0);
    expect(delay).toBeGreaterThanOrEqual(DEFAULT_BACKOFF_DELAYS[0]);
    expect(delay).toBeLessThan(DEFAULT_BACKOFF_DELAYS[0] + 5_000);
  });
});

describe("swrRetryWithBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not retry when offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const revalidate = vi.fn();
    swrRetryWithBackoff(new Error("Network failed"), "key", {}, revalidate, { retryCount: 0 });
    vi.runAllTimers();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("does not retry when document is hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
      writable: true,
    });
    const revalidate = vi.fn();
    swrRetryWithBackoff(new Error("Network failed"), "key", {}, revalidate, { retryCount: 0 });
    vi.runAllTimers();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404])("does not retry on ApiError with status %i", (status) => {
    const revalidate = vi.fn();
    swrRetryWithBackoff(new ApiError("Client error", status), "key", {}, revalidate, { retryCount: 0 });
    vi.runAllTimers();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("does not retry when retryCount reaches errorRetryCount", () => {
    const revalidate = vi.fn();
    swrRetryWithBackoff(new Error("Server error"), "key", { errorRetryCount: 3 }, revalidate, { retryCount: 3 });
    vi.runAllTimers();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("schedules revalidate with backoff for retryable errors", () => {
    const revalidate = vi.fn();
    swrRetryWithBackoff(new ApiError("Internal error", 500), "key", {}, revalidate, { retryCount: 0 });
    expect(revalidate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(35_000);
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith({ retryCount: 1 });
  });
});

