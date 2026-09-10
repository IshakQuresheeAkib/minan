import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HomeCatalogClient } from "./HomeCatalogClient";

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="selected-category-products" />,
}));

describe("HomeCatalogClient", () => {
  it("renders only product-bearing category slots in the initial all view", () => {
    const markup = renderToStaticMarkup(
      <HomeCatalogClient
        categories={[
          {
            hasProducts: true,
            imageUrl: "https://example.com/women.jpg",
            name: "Women",
            slug: "women",
          },
          {
            hasProducts: false,
            imageUrl: "https://example.com/empty.jpg",
            name: "Empty",
            slug: "empty",
          },
        ]}
      >
        <div>Women products</div>
        <div>No products available in this category yet.</div>
      </HomeCatalogClient>,
    );

    expect(markup).toContain("FEATURED CATEGORIES");
    expect(markup).toContain("Women products");
    expect(markup).not.toContain("No products available in this category yet.");
  });
});
