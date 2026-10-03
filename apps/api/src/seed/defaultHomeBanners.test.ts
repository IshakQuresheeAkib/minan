import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_BANNERS } from "./defaultHomeBanners.js";

describe("default homepage banners", () => {
  it("seeds one banner with the desktop and mobile fallback variants", () => {
    expect(DEFAULT_HOME_BANNERS).toEqual([
      {
        alt_text: "MINAN men's clothing collection campaign",
        desktop_image_url: "/hero/desktop-fallback.webp",
        mobile_image_url: "/hero/mobile-fallback.webp",
      },
    ]);
  });
});
