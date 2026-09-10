import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import NotFoundPage, { metadata } from "./not-found";

describe("not-found route", () => {
  it("sets a route-specific title and renders the storefront recovery page", () => {
    expect(metadata.title).toBe("Page not found");

    const markup = renderToStaticMarkup(<NotFoundPage />);

    expect(markup).toContain("This page slipped off the rack.");
    expect(markup).toContain('href="/"');
  });
});
