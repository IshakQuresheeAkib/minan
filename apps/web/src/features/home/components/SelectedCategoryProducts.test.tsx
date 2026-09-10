import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SelectedCategoryProducts } from "./SelectedCategoryProducts";

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="product-skeleton" />,
}));

vi.mock("@/features/products/services/product.service", () => ({
  getProducts: vi.fn(() => new Promise(() => undefined)),
  mapProductToCard: vi.fn(),
}));

describe("SelectedCategoryProducts", () => {
  it("keeps the server preview visible while the full category loads", () => {
    const markup = renderToStaticMarkup(
      <SelectedCategoryProducts
        category={{
          imageUrl: "https://example.com/women.jpg",
          name: "Women",
          slug: "women",
        }}
        initialContent={<div>Server-rendered Women preview</div>}
      />,
    );

    expect(markup).toContain("Server-rendered Women preview");
    expect(markup).toContain('aria-label="Loading more Women products"');
  });
});
