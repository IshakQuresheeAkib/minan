import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/features/products/schemas/product.schema";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import sitemap from "./sitemap";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: mocks.connection,
}));

vi.mock("@/features/products/services/product.cache", () => ({
  getCachedProductFilterOptions: vi.fn(),
  getCachedProducts: vi.fn(),
}));

const product: Product = {
  _id: "product-1",
  name: "Linen Shirt",
  slug: "linen-shirt",
  description: "Soft linen shirt",
  price: 1000,
  discount: 0,
  discounted_price: 1000,
  category_id: "category-1",
  category: { name: "Shirts", slug: "shirts" },
  subcategory_id: null,
  subcategory: null,
  sizes: [],
  colors: [],
  images: [],
  is_active: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.mockResolvedValue(undefined);
    vi.mocked(getCachedProductFilterOptions).mockResolvedValue({
      categories: [],
      colors: [],
      sizes: [],
      price: { min: 0, max: 0 },
    });
  });

  it("loads every product page and omits synthetic static timestamps", async () => {
    vi.mocked(getCachedProducts)
      .mockResolvedValueOnce({
        data: [product],
        total: 2,
        page: 1,
        limit: 100,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        data: [{ ...product, _id: "product-2", slug: "cotton-shirt" }],
        total: 2,
        page: 2,
        limit: 100,
        hasMore: false,
      });

    const entries = await sitemap();

    expect(getCachedProducts).toHaveBeenNthCalledWith(1, {
      page: 1,
      limit: 100,
    });
    expect(getCachedProducts).toHaveBeenNthCalledWith(2, {
      page: 2,
      limit: 100,
    });
    expect(entries.filter(({ url }) => url.includes("/products/"))).toHaveLength(
      2,
    );
    expect(entries[0]).not.toHaveProperty("lastModified");
    expect(entries[1]).not.toHaveProperty("lastModified");
  });

  it("does not return a silently truncated sitemap when products are unavailable", async () => {
    vi.mocked(getCachedProducts).mockRejectedValue(
      new Error("Catalog API unavailable"),
    );

    await expect(sitemap()).rejects.toThrow("Catalog API unavailable");
    expect(mocks.connection).toHaveBeenCalledOnce();
  });

  it("keeps product URLs when collection filters are unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getCachedProducts).mockResolvedValue({
      data: [product],
      total: 1,
      page: 1,
      limit: 100,
      hasMore: false,
    });
    vi.mocked(getCachedProductFilterOptions).mockRejectedValue(
      new Error("Collection filters unavailable"),
    );

    const entries = await sitemap();

    expect(entries.some(({ url }) => url.endsWith("/products/linen-shirt"))).toBe(
      true,
    );
    expect(entries.some(({ url }) => url.includes("/collections/"))).toBe(
      false,
    );
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
