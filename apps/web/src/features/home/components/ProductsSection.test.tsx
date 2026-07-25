import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ProductsSection,
  type HomeCategoryProductGroup,
} from "./ProductsSection";

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="product-skeleton" />,
}));

vi.mock("@/features/home/components/CategoryGridCard", () => ({
  CategoryGridCard: ({ name }: { name: string }) => (
    <article data-testid="category-card">{name}</article>
  ),
}));

vi.mock("@/features/products/components/ProductCard", () => ({
  ProductCard: ({ product }: { product: { slug: string } }) => (
    <article data-testid="product-card">{product.slug}</article>
  ),
}));

vi.mock("@/features/products/services/product.service", () => ({
  getProducts: vi.fn(() => new Promise(() => undefined)),
  mapProductToCard: (product: {
    discount: number;
    discounted_price: number;
    images: string[];
    name: string;
    price: number;
    slug: string;
  }) => ({
    slug: product.slug,
    name: product.name,
    price: product.discounted_price,
    originalPrice: product.price,
    discount: product.discount,
    imageUrl: product.images[0],
  }),
}));

function createCategoryGroup(): HomeCategoryProductGroup {
  const products = Array.from({ length: 7 }, (_, index) => ({
    _id: `product-${index}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
    description: "Product description",
    price: 1000,
    discount: 0,
    discounted_price: 1000,
    category_id: "women",
    category: { name: "Women", slug: "women" },
    subcategory_id: null,
    subcategory: null,
    sizes: [],
    colors: [],
    images: [],
    is_active: true,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  }));

  return {
    category: {
      name: "Women",
      slug: "women",
      image_url: "https://example.com/women.jpg",
    },
    products: {
      data: products,
      total: 10,
      page: 1,
      limit: 7,
      hasMore: true,
    },
  };
}

describe("ProductsSection selected category", () => {
  it("keeps every product visible on mobile and shows card skeletons while loading", () => {
    const markup = renderToStaticMarkup(
      <ProductsSection
        activeCategorySlug="women"
        categoryGroups={[createCategoryGroup()]}
      />,
    );

    expect(markup).not.toContain("hidden h-full xl:block");
    expect(markup).toContain('aria-label="Loading more Women products"');
    expect(markup).not.toContain("Loading all Women products...");
  });
});
