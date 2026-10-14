import { describe, expect, it, vi } from "vitest";

describe("SearchBar product search loading", () => {
  it("does not load the product service while initializing the search UI", async () => {
    const recordProductServiceLoad = vi.fn();

    vi.doMock("@/features/products/services/product.service", () => {
      recordProductServiceLoad();

      return {
        getProducts: vi.fn(),
      };
    });

    await import("./SearchBar");

    expect(recordProductServiceLoad).not.toHaveBeenCalled();
  });
});
