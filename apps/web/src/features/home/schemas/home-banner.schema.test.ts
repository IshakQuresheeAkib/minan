import { describe, expect, it } from "vitest";

import { homeBannerListSchema } from "./home-banner.schema";

describe("home banner response schema", () => {
  it("accepts trusted local seed images", () => {
    expect(
      homeBannerListSchema.safeParse({
        data: [
          {
            _id: "seed",
            alt_text: "Three models wearing MINAN panjabi",
            desktop_image_url: "/hero/limited-offer.webp",
            mobile_image_url: "/hero/limited-offer.webp",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects more than five banners", () => {
    expect(
      homeBannerListSchema.safeParse({
        data: Array.from({ length: 6 }, (_, index) => ({
          _id: String(index),
          alt_text: "Three models wearing MINAN panjabi",
          desktop_image_url: "/hero/limited-offer.webp",
          mobile_image_url: "/hero/limited-offer.webp",
        })),
      }).success,
    ).toBe(false);
  });

  it("requires descriptive image text", () => {
    expect(
      homeBannerListSchema.safeParse({
        data: [
          {
            _id: "missing-copy",
            desktop_image_url: "/hero/limited-offer.webp",
            mobile_image_url: "/hero/limited-offer.webp",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
