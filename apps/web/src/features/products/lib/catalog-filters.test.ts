import { describe, expect, it } from "vitest";

import {
  hasCatalogQuery,
  parseCatalogFilters,
} from "@/features/products/lib/catalog-filters";

describe("catalog filters", () => {
  it("locks collection pages to their route category", () => {
    const filters = parseCatalogFilters(
      {
        category: "another-category",
        color: ["Black", "Black"],
        minPrice: "2000",
        maxPrice: "1000",
      },
      "shirts",
    );

    expect(filters.categories).toEqual(["shirts"]);
    expect(filters.colors).toEqual(["Black"]);
    expect(filters.minPrice).toBe(1000);
    expect(filters.maxPrice).toBe(2000);
  });

  it("detects refinements that should not be indexed", () => {
    expect(hasCatalogQuery({})).toBe(false);
    expect(hasCatalogQuery({ sort: "price-asc" })).toBe(true);
  });
});
