import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  configureGa4RouteScoping,
  extractPathname,
  isAnalyticsAllowed,
  setGa4Disabled,
} from "./routes";

describe("isAnalyticsAllowed", () => {
  it.each([
    "/",
    "/products",
    "/products/classic-tee",
    "/collections/summer-2026",
    "/cart",
    "/checkout",
    "/checkout/buy-now",
    "/orders",
  ])("allows public storefront route: %s", (path) => {
    expect(isAnalyticsAllowed(path)).toBe(true);
  });

  it.each([
    "/payment",
    "/payment/result",
    "/account",
    "/account/orders",
    "/account/orders/MN-20260901-0001",
    "/account/login",
    "/admin",
    "/admin/login",
    "/admin/orders",
    "/admin/products",
  ])("blocks excluded private/payment/admin route: %s", (path) => {
    expect(isAnalyticsAllowed(path)).toBe(false);
  });

  it.each([null, undefined, "", "   "])(
    "blocks empty or invalid path: %s",
    (path) => {
      expect(isAnalyticsAllowed(path)).toBe(false);
    },
  );
});

describe("extractPathname", () => {
  it("extracts pathname from relative paths", () => {
    expect(extractPathname("/payment/result?reference=secret")).toBe(
      "/payment/result",
    );
    expect(extractPathname("/products")).toBe("/products");
  });

  it("extracts pathname from absolute URLs", () => {
    expect(
      extractPathname("https://minan.store/payment/result?reference=secret"),
    ).toBe("/payment/result");
  });

  it("extracts pathname from URL instances", () => {
    expect(extractPathname(new URL("https://minan.store/account/orders"))).toBe(
      "/account/orders",
    );
  });

  it.each([null, undefined, ""])("returns null for empty input: %s", (val) => {
    expect(extractPathname(val)).toBeNull();
  });
});

describe("setGa4Disabled", () => {
  const measurementId = "G-TEST123456";

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toggles the global ga-disable flag on window", () => {
    const mockWindow = {} as Record<string, boolean>;
    vi.stubGlobal("window", mockWindow);

    setGa4Disabled(measurementId, true);
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(true);

    setGa4Disabled(measurementId, false);
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(false);
  });
});

describe("configureGa4RouteScoping", () => {
  const measurementId = "G-TEST123456";
  let mockWindow: {
    history: {
      pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
      replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
    };
    location: {
      pathname: string;
      origin: string;
    };
    addEventListener: (type: string, listener: () => void, useCapture?: boolean) => void;
    removeEventListener: (type: string, listener: () => void, useCapture?: boolean) => void;
    [key: string]: unknown;
  };

  beforeEach(() => {
    const pushState = vi.fn();
    const replaceState = vi.fn();
    mockWindow = {
      history: { pushState, replaceState },
      location: { pathname: "/products", origin: "http://localhost" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", mockWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("synchronously disables GA4 when pushState navigates to an excluded route", () => {
    const cleanup = configureGa4RouteScoping(measurementId);

    mockWindow.history.pushState(
      null,
      "",
      "/payment/result?reference=30min-secret-token",
    );
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(true);

    mockWindow.history.pushState(null, "", "/products");
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(false);

    cleanup();
  });

  it("synchronously disables GA4 when replaceState navigates to an excluded route", () => {
    const cleanup = configureGa4RouteScoping(measurementId);

    mockWindow.history.replaceState(null, "", "/account/orders");
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(true);

    mockWindow.history.replaceState(null, "", "/cart");
    expect(mockWindow[`ga-disable-${measurementId}`]).toBe(false);

    cleanup();
  });

  it("restores original history methods upon cleanup", () => {
    const originalPush = mockWindow.history.pushState;
    const cleanup = configureGa4RouteScoping(measurementId);

    expect(mockWindow.history.pushState).not.toBe(originalPush);
    cleanup();
    expect(mockWindow.history.pushState).toBe(originalPush);
  });
});
