import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { initializeMetaPixel, trackPixelEvent } from "./pixel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initializeMetaPixel", () => {
  it("loads Meta's browser library and queues initialization with the configured Pixel ID", () => {
    const insertBefore = vi.fn();
    const firstScript = { parentNode: { insertBefore } };
    const createdScript: { async?: boolean; src?: string } = {};

    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      createElement: vi.fn(() => createdScript),
      getElementsByTagName: vi.fn(() => [firstScript]),
      head: { appendChild: vi.fn() },
    });

    initializeMetaPixel("1973835693285548");

    expect(createdScript).toEqual({
      async: true,
      src: "https://connect.facebook.net/en_US/fbevents.js",
    });
    expect(insertBefore).toHaveBeenCalledWith(createdScript, firstScript);
    expect(window.fbq?.queue).toEqual([["init", "1973835693285548"]]);
  });

  it("tracks configured Pixel events without a visitor consent record", () => {
    const fbq = vi.fn();
    const originalPixelId = env.metaPixelId;

    Object.assign(env, { metaPixelId: "1973835693285548" });
    vi.stubGlobal("window", { fbq });

    trackPixelEvent("PageView");

    expect(fbq).toHaveBeenCalledWith("track", "PageView", {});

    Object.assign(env, { metaPixelId: originalPixelId });
  });
});
