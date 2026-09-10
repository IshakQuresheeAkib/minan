import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ProductsSection,
  type HomeCategoryProductGroup,
} from "./ProductsSection";

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

describe("ProductsSection category previews", () => {
  it("renders each product preview once across responsive breakpoints", () => {
    const markup = renderToStaticMarkup(
      <ProductsSection categoryGroups={[createCategoryGroup()]} />,
    );

    expect(markup.match(/>product-4<\/article>/g)).toHaveLength(1);
  });
});
