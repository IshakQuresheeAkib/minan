import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeCatalogSkeleton } from "./HomeCatalogSkeleton";

describe("HomeCatalogSkeleton", () => {
  it("renders the catalog section with heading and chips placeholders to avoid layout shift", () => {
    const markup = renderToStaticMarkup(<HomeCatalogSkeleton />);

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Loading featured catalog"');
    expect(markup).toContain("space-y-6");
    expect(markup).toContain("space-y-5");
    expect(markup).toContain("overflow-x-clip");
  });
});
