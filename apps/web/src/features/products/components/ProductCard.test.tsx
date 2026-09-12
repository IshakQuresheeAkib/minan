import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductCard } from "./ProductCard";

describe("ProductCard compact view-more state", () => {
  it("keeps the product image visible below the desktop breakpoint", () => {
    const markup = renderToStaticMarkup(
      <ProductCard
        product={{
          discount: 0,
          imageUrl: "https://example.com/product.jpg",
          name: "Product",
          originalPrice: 1000,
          price: 1000,
          slug: "product",
        }}
        wholeCardCta={{
          compactOnly: true,
          href: "/collections/women",
          label: "View more Women products",
          overlayText: "View more",
        }}
      />,
    );

    expect(markup).toContain('alt="Product"');
    expect(markup).not.toMatch(/<a[^>]*hidden xl:block[^>]*><img/);
    expect(markup.match(/View Product/g)).toHaveLength(1);
  });
});
