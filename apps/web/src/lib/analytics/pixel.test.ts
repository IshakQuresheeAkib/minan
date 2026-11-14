import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/config/env";
import { getMetaCookies, initializeMetaPixel, trackPixelEvent } from "./pixel";

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

    initializeMetaPixel("2335333213885429");

    expect(createdScript).toEqual({
      async: true,
      src: "https://connect.facebook.net/en_US/fbevents.js",
    });
    expect(insertBefore).toHaveBeenCalledWith(createdScript, firstScript);
    expect(window.fbq?.queue).toEqual([["init", "2335333213885429"]]);
  });

  it("tracks configured Pixel events without a visitor consent record", () => {
    const fbq = vi.fn();
    const originalPixelId = env.metaPixelId;

    Object.assign(env, { metaPixelId: "2335333213885429" });
    vi.stubGlobal("window", { fbq });

    trackPixelEvent("PageView");

    expect(fbq).toHaveBeenCalledWith("track", "PageView", {});

    Object.assign(env, { metaPixelId: originalPixelId });
  });
});

describe("getMetaCookies", () => {
  it("returns empty object when document is undefined (SSR)", () => {
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("window", undefined);

    expect(getMetaCookies()).toEqual({});
  });

  it("extracts fbp and fbc when present in document.cookie", () => {
    vi.stubGlobal("document", {
      cookie: "_fbp=fb.1.1710000000.123456789; _fbc=fb.1.1710000000.abc123xyz; session=xyz",
    });
    vi.stubGlobal("window", { location: { search: "" } });

    expect(getMetaCookies()).toEqual({
      fbp: "fb.1.1710000000.123456789",
      fbc: "fb.1.1710000000.abc123xyz",
    });
  });

  it("safely ignores malformed percent-encoding in unrelated cookies without throwing", () => {
    vi.stubGlobal("document", {
      cookie: "discount=50%off; bad_cookie=%E0%A4%A; _fbp=fb.1.123; promo=save%25",
    });
    vi.stubGlobal("window", { location: { search: "" } });

    expect(getMetaCookies()).toEqual({
      fbp: "fb.1.123",
      fbc: undefined,
    });
  });

  it("safely falls back to raw value if fbp/fbc itself contains malformed percent-encoding", () => {
    vi.stubGlobal("document", {
      cookie: "_fbp=fb.1.123%ZZ; _fbc=fb.1.456%99",
    });
    vi.stubGlobal("window", { location: { search: "" } });

    expect(getMetaCookies()).toEqual({
      fbp: "fb.1.123%ZZ",
      fbc: "fb.1.456%99",
    });
  });

  it("constructs fallback fbc from window.location.search when _fbc cookie is absent", () => {
    vi.stubGlobal("document", {
      cookie: "_fbp=fb.1.12345",
    });
    vi.stubGlobal("window", {
      location: { search: "?utm_source=meta&fbclid=click_12345" },
    });

    const now = 1710000000000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    expect(getMetaCookies()).toEqual({
      fbp: "fb.1.12345",
      fbc: `fb.1.${now}.click_12345`,
    });
  });

  it("prefers existing _fbc cookie over fbclid query parameter", () => {
    vi.stubGlobal("document", {
      cookie: "_fbp=fb.1.12345; _fbc=fb.1.existing.cookie",
    });
    vi.stubGlobal("window", {
      location: { search: "?fbclid=new_query_click" },
    });

    expect(getMetaCookies()).toEqual({
      fbp: "fb.1.12345",
      fbc: "fb.1.existing.cookie",
    });
  });
});
