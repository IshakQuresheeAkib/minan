import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  pathname: "/",
}));

const pixelMocks = vi.hoisted(() => ({
  initializeMetaPixel: vi.fn(),
  trackPixelEvent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("@/lib/analytics/pixel", () => ({
  initializeMetaPixel: pixelMocks.initializeMetaPixel,
  trackPixelEvent: pixelMocks.trackPixelEvent,
}));

// Mock React useEffect to execute during renderToStaticMarkup
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      effect();
    },
  };
});

import { env } from "@/config/env";
import { MetaPixel } from "./MetaPixel";

describe("MetaPixel", () => {
  const originalPixelId = env.metaPixelId;

  beforeEach(() => {
    Object.assign(env, { metaPixelId: "1973835693285548" });
    navigationState.pathname = "/";
    pixelMocks.initializeMetaPixel.mockReset();
    pixelMocks.trackPixelEvent.mockReset();
  });

  afterEach(() => {
    Object.assign(env, { metaPixelId: originalPixelId });
  });

  it("initializes and tracks PageView on public routes", () => {
    navigationState.pathname = "/products";
    renderToStaticMarkup(<MetaPixel />);

    expect(pixelMocks.initializeMetaPixel).toHaveBeenCalledWith(
      "1973835693285548",
    );
    expect(pixelMocks.trackPixelEvent).toHaveBeenCalledWith("PageView");
  });

  it.each([
    "/payment/result",
    "/payment",
    "/account",
    "/account/orders",
    "/account/login",
    "/admin",
    "/admin/login",
    "/admin/orders",
  ])("does not initialize or track on excluded route: %s", (path) => {
    navigationState.pathname = path;
    renderToStaticMarkup(<MetaPixel />);

    expect(pixelMocks.initializeMetaPixel).not.toHaveBeenCalled();
    expect(pixelMocks.trackPixelEvent).not.toHaveBeenCalled();
  });

  it("does not initialize or track when pixelId is empty", () => {
    Object.assign(env, { metaPixelId: "" });
    navigationState.pathname = "/products";
    renderToStaticMarkup(<MetaPixel />);

    expect(pixelMocks.initializeMetaPixel).not.toHaveBeenCalled();
    expect(pixelMocks.trackPixelEvent).not.toHaveBeenCalled();
  });
});
