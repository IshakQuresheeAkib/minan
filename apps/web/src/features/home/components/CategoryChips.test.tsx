import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CategoryChips } from "./CategoryChips";

describe("CategoryChips", () => {
  it("does not show All as loading when no category transition is pending", () => {
    const markup = renderToStaticMarkup(
      <CategoryChips
        categories={[{ name: "Women", slug: "women" }]}
        activeCategorySlug={undefined}
        pendingCategorySlug={undefined}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-busy="false"');
    expect(markup).not.toContain('aria-label="Loading All products"');
    expect(markup).not.toContain("animate-spin");
  });

  it("shows which category is loading while its product view is pending", () => {
    const markup = renderToStaticMarkup(
      <CategoryChips
        categories={[{ name: "Women", slug: "women" }]}
        activeCategorySlug={undefined}
        pendingCategorySlug="women"
        onCategoryChange={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Loading Women products"');
    expect(markup).toContain("animate-spin");
  });
});
