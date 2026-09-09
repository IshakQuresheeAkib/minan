import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductBreadcrumbs } from "./ProductBreadcrumbs";

describe("ProductBreadcrumbs", () => {
  it("renders the home destination as an accessible icon link", () => {
    const markup = renderToStaticMarkup(
      <ProductBreadcrumbs
        category={null}
        subcategory={null}
        productName="Essential T-Shirt"
      />,
    );

    expect(markup).toContain('<nav aria-label="Breadcrumb"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="Home"');
    expect(markup).toContain('width="32"');
    expect(markup).toContain('height="32"');
    expect(markup).not.toContain(">Home</a>");
  });

  it("keeps the dynamic collection trail and current product semantics", () => {
    const markup = renderToStaticMarkup(
      <ProductBreadcrumbs
        category={{ name: "Men's Wear", slug: "mens-wear" }}
        subcategory={{ name: "T-Shirts", slug: "graphic tees" }}
        productName="Essential T-Shirt"
      />,
    );

    expect(markup).toContain('href="/products"');
    expect(markup).toContain('href="/collections/mens-wear"');
    expect(markup).toContain(
      'href="/collections/mens-wear?subcategory=graphic%20tees"',
    );
    expect(markup).toContain("Men&#x27;s Wear");
    expect(markup).toContain("T-Shirts");
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("Essential T-Shirt");
  });
});
