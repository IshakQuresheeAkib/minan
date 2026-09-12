import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeCatalogClient } from "./HomeCatalogClient";

const testHarness = vi.hoisted(() => ({
  onCategoryChange: undefined as ((slug?: string) => void) | undefined,
  resolveSelectedCategoryModule: undefined as
    | ((module: {
        SelectedCategoryProducts: () => null;
      }) => void)
    | undefined,
  selectedCategoryModulePromise: undefined as
    | Promise<{ SelectedCategoryProducts: () => null }>
    | undefined,
  setActiveCategorySlug: undefined as ReturnType<typeof vi.fn> | undefined,
  setPendingCategorySlug: undefined as ReturnType<typeof vi.fn> | undefined,
  useStateCallCount: 0,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useState: () => {
      const setter = testHarness.useStateCallCount === 0
        ? testHarness.setActiveCategorySlug
        : testHarness.setPendingCategorySlug;
      testHarness.useStateCallCount += 1;
      return [undefined, setter];
    },
  };
});

vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="selected-category-products" />,
}));

vi.mock("@/features/home/components/CategoryChips", () => ({
  CategoryChips: ({
    onCategoryChange,
  }: {
    onCategoryChange: (slug?: string) => void;
  }) => {
    testHarness.onCategoryChange = onCategoryChange;
    return <div data-testid="category-chips" />;
  },
}));

vi.mock(
  "@/features/home/components/SelectedCategoryProducts",
  async () => await testHarness.selectedCategoryModulePromise!,
);

describe("HomeCatalogClient", () => {
  beforeEach(() => {
    testHarness.onCategoryChange = undefined;
    testHarness.setActiveCategorySlug = vi.fn();
    testHarness.setPendingCategorySlug = vi.fn();
    testHarness.useStateCallCount = 0;
    testHarness.selectedCategoryModulePromise = new Promise((resolve) => {
      testHarness.resolveSelectedCategoryModule = resolve;
    });
  });

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

  it("keeps the current preview active until the category bundle loads", async () => {
    renderToStaticMarkup(
      <HomeCatalogClient
        categories={[
          {
            hasProducts: true,
            imageUrl: "https://example.com/women.jpg",
            name: "Women",
            slug: "women",
          },
        ]}
      >
        <div>Women products</div>
      </HomeCatalogClient>,
    );

    testHarness.onCategoryChange?.("women");

    expect(testHarness.setActiveCategorySlug).not.toHaveBeenCalled();
    expect(testHarness.setPendingCategorySlug).toHaveBeenCalledWith("women");

    testHarness.resolveSelectedCategoryModule?.({
      SelectedCategoryProducts: () => null,
    });
    await testHarness.selectedCategoryModulePromise;

    await vi.waitFor(() => {
      expect(testHarness.setActiveCategorySlug).toHaveBeenCalledOnce();
      expect(testHarness.setActiveCategorySlug).toHaveBeenCalledWith("women");
      expect(testHarness.setPendingCategorySlug).toHaveBeenLastCalledWith(
        undefined,
      );
    });
  });

  it("does not apply a stale selection after returning to all categories", async () => {
    renderToStaticMarkup(
      <HomeCatalogClient
        categories={[
          {
            hasProducts: true,
            imageUrl: "https://example.com/women.jpg",
            name: "Women",
            slug: "women",
          },
        ]}
      >
        <div>Women products</div>
      </HomeCatalogClient>,
    );

    testHarness.onCategoryChange?.("women");
    testHarness.onCategoryChange?.();
    testHarness.resolveSelectedCategoryModule?.({
      SelectedCategoryProducts: () => null,
    });
    await testHarness.selectedCategoryModulePromise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(testHarness.setActiveCategorySlug).toHaveBeenCalledOnce();
    expect(testHarness.setActiveCategorySlug).toHaveBeenCalledWith(undefined);
    expect(testHarness.setPendingCategorySlug).toHaveBeenLastCalledWith(
      undefined,
    );
  });

  it("switches immediately when a category has no lazy product view", () => {
    renderToStaticMarkup(
      <HomeCatalogClient
        categories={[
          {
            hasProducts: false,
            imageUrl: "https://example.com/empty.jpg",
            name: "Empty",
            slug: "empty",
          },
        ]}
      >
        <div>No products available in this category yet.</div>
      </HomeCatalogClient>,
    );

    testHarness.onCategoryChange?.("empty");

    expect(testHarness.setActiveCategorySlug).toHaveBeenCalledOnce();
    expect(testHarness.setActiveCategorySlug).toHaveBeenCalledWith("empty");
  });
});
