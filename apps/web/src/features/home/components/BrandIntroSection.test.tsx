import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandIntroSection } from "./BrandIntroSection";

describe("BrandIntroSection", () => {
  it("renders the visible brand heading, location, and value propositions", () => {
    const markup = renderToStaticMarkup(<BrandIntroSection />);

    expect(markup).toContain(
      "MINAN — Contemporary Fashion Crafted in Bangladesh",
    );
    expect(markup).toContain(
      "Kumarpara Point, Opposite of Forid &amp; Brothers",
    );
    expect(markup).toContain("Nationwide Delivery");
    expect(markup).toContain("Flexible Payments");
    expect(markup).toContain('href="/products"');
  });
});
