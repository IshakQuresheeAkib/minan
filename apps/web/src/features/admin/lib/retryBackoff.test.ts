import { describe, expect, it } from "vitest";
import { calculateBackoffWithJitter, DEFAULT_BACKOFF_DELAYS } from "./retryBackoff";

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
