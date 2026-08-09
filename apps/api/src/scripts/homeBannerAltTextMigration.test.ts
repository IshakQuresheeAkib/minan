import { describe, expect, it } from "vitest";

import {
  LEGACY_GENERIC_HOME_BANNER_ALT_TEXT,
  planHomeBannerAltTextMigration,
} from "./homeBannerAltTextMigration.js";

describe("home banner alt-text migration", () => {
  it("backfills the known seeded banners with distinct descriptions", () => {
    const plan = planHomeBannerAltTextMigration([
      {
        _id: "first",
        desktop_image_url: "/hero/limited-offer.webp",
        mobile_image_url: "/hero/limited-offer.webp",
      },
      {
        _id: "second",
        desktop_image_url: "/hero/new-arrivals.jpg",
        mobile_image_url: "/hero/new-arrivals.jpg",
      },
    ]);

    expect(plan.unresolved).toEqual([]);
    expect(plan.changes).toEqual([
      {
        banner_id: "first",
        alt_text:
          "Three men wearing brown, sage green, and ivory MINAN panjabi in an arched interior",
      },
      {
        banner_id: "second",
        alt_text:
          "Two models wearing maroon embroidered MINAN panjabi from the Eid collection",
      },
    ]);
    expect(plan.banners.map((banner) => banner.alt_text)).not.toContain(
      LEGACY_GENERIC_HOME_BANNER_ALT_TEXT,
    );
  });

  it("refuses to guess descriptions for custom legacy banners", () => {
    const plan = planHomeBannerAltTextMigration([
      {
        _id: "custom",
        alt_text: LEGACY_GENERIC_HOME_BANNER_ALT_TEXT,
        desktop_image_url: "https://res.cloudinary.com/minan/custom-desktop.webp",
        mobile_image_url: "https://res.cloudinary.com/minan/custom-mobile.webp",
      },
    ]);

    expect(plan.changes).toEqual([]);
    expect(plan.unresolved).toEqual([
      {
        banner_id: "custom",
        desktop_image_url:
          "https://res.cloudinary.com/minan/custom-desktop.webp",
        mobile_image_url:
          "https://res.cloudinary.com/minan/custom-mobile.webp",
      },
    ]);
  });

  it("uses an explicit description for a custom legacy banner", () => {
    const plan = planHomeBannerAltTextMigration(
      [
        {
          _id: "custom",
          desktop_image_url: "https://res.cloudinary.com/minan/custom-desktop.webp",
          mobile_image_url: "https://res.cloudinary.com/minan/custom-mobile.webp",
        },
      ],
      { custom: "  A model wearing a navy MINAN polo shirt  " },
    );

    expect(plan.unresolved).toEqual([]);
    expect(plan.banners[0]?.alt_text).toBe(
      "A model wearing a navy MINAN polo shirt",
    );
  });

  it("preserves an existing valid description", () => {
    const plan = planHomeBannerAltTextMigration([
      {
        _id: "described",
        alt_text: "A model wearing an ivory embroidered panjabi",
        desktop_image_url: "desktop.webp",
        mobile_image_url: "mobile.webp",
      },
    ]);

    expect(plan.changes).toEqual([]);
    expect(plan.unresolved).toEqual([]);
    expect(plan.banners[0]?.alt_text).toBe(
      "A model wearing an ivory embroidered panjabi",
    );
  });
});
