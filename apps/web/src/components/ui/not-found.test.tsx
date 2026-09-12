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
    expect(markup).toContain("minan-ghost-404_haki5o.webp");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Back to MINAN");
    expect(markup).toContain('href="/products"');
    expect(markup).toContain("Browse the collection");
    expect(markup.match(/data-slot="button"/g)).toHaveLength(2);
    expect(markup).not.toMatch(/<a[^>]*>\s*<button/);
  });

  it("does not eagerly preload its optimized decorative ghost", () => {
    const markup = renderToStaticMarkup(<NotFound />);
    const imagePreloads = markup.match(/<link rel="preload" as="image"[^>]*>/g);

    expect(markup).toContain("q_auto%2Cw_320");
    expect(imagePreloads).toHaveLength(1);
    expect(imagePreloads?.[0]).toContain("%2Flogo.png");
    expect(imagePreloads?.[0]).not.toContain("minan-ghost-404");
  });
});
