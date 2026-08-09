import { describe, expect, it } from "vitest";

import { HomeBannerSet } from "../models/HomeBannerSet.js";
import {
  homeBannerCreateSchema,
  homeBannerReorderSchema,
  homeBannerUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
} from "./admin.schemas.js";
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from "../utils/productDescription.js";

const cloudinaryUrl =
  "https://res.cloudinary.com/minan/image/upload/v1/minan/admin/banner.webp";

describe("home banner validation", () => {
  it("accepts managed Cloudinary create payloads", () => {
    expect(
      homeBannerCreateSchema.safeParse({
        alt_text: "A model wearing a maroon embroidered panjabi",
        desktop_image_url: cloudinaryUrl,
        mobile_image_url: cloudinaryUrl,
        expected_revision: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects non-Cloudinary admin image URLs", () => {
    expect(
      homeBannerCreateSchema.safeParse({
        alt_text: "A model wearing a maroon embroidered panjabi",
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

  it("accepts image description changes without replacing images", () => {
    expect(
      homeBannerUpdateSchema.safeParse({
        alt_text: "Three models wearing neutral MINAN panjabi",
        expected_revision: 2,
      }).success,
    ).toBe(true);
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

describe("product description validation", () => {
  const baseProduct = {
    name: "Linen Shirt",
    price: 1200,
    discount: 0,
    category_id: "507f1f77bcf86cd799439011",
    sizes: [],
    colors: [],
    images: [],
  };

  it("accepts either legacy plain text or rich HTML on create", () => {
    expect(
      productCreateSchema.safeParse({
        ...baseProduct,
        description: "Plain description",
      }).success,
    ).toBe(true);
    expect(
      productCreateSchema.safeParse({
        ...baseProduct,
        description_html: "<p>Rich description</p>",
      }).success,
    ).toBe(true);
  });

  it("requires a description on create", () => {
    expect(productCreateSchema.safeParse(baseProduct).success).toBe(false);
  });

  it("accepts a rich-description-only update", () => {
    expect(
      productUpdateSchema.safeParse({
        description_html: "<p>Updated description</p>",
      }).success,
    ).toBe(true);
  });

  it("rejects oversized rich descriptions", () => {
    expect(
      productCreateSchema.safeParse({
        ...baseProduct,
        description_html: "x".repeat(
          MAX_PRODUCT_DESCRIPTION_LENGTH + 1,
        ),
      }).success,
    ).toBe(false);
  });
});
