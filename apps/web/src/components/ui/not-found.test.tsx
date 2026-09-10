import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NotFound } from "./not-found";

describe("NotFound", () => {
  it("gives lost shoppers accessible ways back into the storefront", () => {
    const markup = renderToStaticMarkup(<NotFound />);

    expect(markup).toContain("<main");
    expect(markup).toContain('aria-label="MINAN — go to homepage"');
    expect(markup).toContain("%2Flogo.png");
    expect(markup).toContain('aria-label="Error 404"');
    expect(markup).toContain("This page slipped off the rack.");
    expect(markup).toContain("%2Fimages%2Fminan-ghost-404.png");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Back to MINAN");
    expect(markup).toContain('href="/products"');
    expect(markup).toContain("Browse the collection");
    expect(markup.match(/data-slot="button"/g)).toHaveLength(2);
    expect(markup).not.toMatch(/<a[^>]*>\s*<button/);
  });
});
