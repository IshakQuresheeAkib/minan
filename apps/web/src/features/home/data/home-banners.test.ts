import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { fallbackHomeBanners } from "./home-banners";

describe("fallback homepage banners", () => {
  it("uses the desktop and mobile fallback assets as one responsive banner", () => {
    expect(fallbackHomeBanners).toHaveLength(1);
    expect(fallbackHomeBanners[0]).toMatchObject({
      desktop_image_url: "/hero/desktop-fallback.webp",
      mobile_image_url: "/hero/mobile-fallback.webp",
    });
  });

  it("keeps the image used by existing homepage banner records", () => {
    const legacyImagePath = fileURLToPath(
      new URL("../../../../public/hero/desktop-fallback.webp", import.meta.url),
    );

    expect(existsSync(legacyImagePath)).toBe(true);
  });
});
