import { describe, expect, it } from "vitest";

import { HomeBannerSet } from "../models/HomeBannerSet.js";
import {
  homeBannerCreateSchema,
  homeBannerReorderSchema,
  homeBannerUpdateSchema,
} from "./admin.schemas.js";

const cloudinaryUrl =
  "https://res.cloudinary.com/minan/image/upload/v1/minan/admin/banner.webp";

describe("home banner validation", () => {
  it("accepts managed Cloudinary create payloads", () => {
    expect(
      homeBannerCreateSchema.safeParse({
        desktop_image_url: cloudinaryUrl,
        mobile_image_url: cloudinaryUrl,
        expected_revision: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects non-Cloudinary admin image URLs", () => {
    expect(
      homeBannerCreateSchema.safeParse({
        desktop_image_url: "https://example.com/banner.jpg",
        mobile_image_url: cloudinaryUrl,
        expected_revision: 1,
      }).success,
    ).toBe(false);
  });

  it("requires an actual image change on update", () => {
    expect(
      homeBannerUpdateSchema.safeParse({ expected_revision: 2 }).success,
    ).toBe(false);
  });

  it("rejects duplicate reorder ids", () => {
    expect(
      homeBannerReorderSchema.safeParse({
        ordered_ids: ["one", "one"],
        expected_revision: 2,
      }).success,
    ).toBe(false);
  });

  it("enforces the one-to-five model invariant", async () => {
    const empty = new HomeBannerSet({
      key: "homepage",
      revision: 1,
      banners: [],
    });
    const six = new HomeBannerSet({
      key: "homepage",
      revision: 1,
      banners: Array.from({ length: 6 }, () => ({
        desktop_image_url: cloudinaryUrl,
        mobile_image_url: cloudinaryUrl,
      })),
    });

    await expect(empty.validate()).rejects.toMatchObject({
      errors: { banners: expect.anything() },
    });
    await expect(six.validate()).rejects.toMatchObject({
      errors: { banners: expect.anything() },
    });
  });
});
