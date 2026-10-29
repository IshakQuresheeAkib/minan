import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandFaqSection } from "./BrandFaqSection";

describe("BrandFaqSection", () => {
  it("renders the FAQ section with all key brand questions", () => {
    const markup = renderToStaticMarkup(<BrandFaqSection />);

    expect(markup).toContain("Everything You Need to Know About MINAN");
    expect(markup).toContain("What is MINAN?");
    expect(markup).toContain("Where is the official MINAN store located?");
    expect(markup).toContain("Does MINAN deliver all across Bangladesh?");
    expect(markup).toContain("What payment methods are accepted by MINAN?");
  });
});
