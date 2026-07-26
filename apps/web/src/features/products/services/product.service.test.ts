import { describe, expect, it } from "vitest";

import type { Product } from "@/features/products/schemas/product.schema";
import { getRelatedProductsOptions } from "@/features/products/services/product.service";

const product: Product = {
  _id: "product-1",
  name: "Oxford Shirt",
  slug: "oxford-shirt",
  description: "A cotton Oxford shirt.",
  price: 2500,
  discount: 0,
  discounted_price: 2500,
  category_id: "category-1",
  category: {
    name: "Men",
    slug: "men",
  },
  subcategory_id: "subcategory-1",
  subcategory: {
    name: "Shirts",
    slug: "shirts",
  },
  sizes: ["M"],
  colors: ["White"],
  images: ["https://example.com/oxford-shirt.jpg"],
  is_active: true,
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

describe("getRelatedProductsOptions", () => {
  it("filters related products to the same category and subcategory", () => {
    expect(getRelatedProductsOptions(product)).toEqual({
      category: "men",
      subcategories: ["shirts"],
      exclude: "oxford-shirt",
      limit: 4,
    });
  });

  it("falls back to the category when the product has no subcategory", () => {
    expect(
      getRelatedProductsOptions({
        ...product,
        subcategory_id: null,
        subcategory: null,
      }),
    ).toEqual({
      category: "men",
      exclude: "oxford-shirt",
      limit: 4,
    });
  });

  it("returns no query when the product has no category", () => {
    expect(
      getRelatedProductsOptions({
        ...product,
        category: null,
        subcategory_id: null,
        subcategory: null,
      }),
    ).toBeNull();
  });
});
