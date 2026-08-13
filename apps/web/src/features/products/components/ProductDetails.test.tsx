import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { ProductDetail } from "@/features/products/schemas/product.schema";
import { createProductShareData, ProductDetails } from "./ProductDetails";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, text }: { children?: ReactNode; text?: string }) => (
    <button type="button">{children ?? text}</button>
  ),
}));

vi.mock("@/features/products/components/ProductBreadcrumbs", () => ({
  ProductBreadcrumbs: () => null,
}));

vi.mock("@/features/products/components/ProductDescription", () => ({
  ProductDescription: () => null,
}));

vi.mock("@/features/products/components/ProductGallery", () => ({
  ProductGallery: () => null,
}));

vi.mock("@/features/products/components/ProductPrice", () => ({
  ProductPrice: () => <div data-testid="product-price" />,
}));

vi.mock("@/features/products/components/SizeGuideModal", () => ({
  SizeGuideModal: () => null,
}));

vi.mock("@/features/products/components/SizeColorSelector", () => ({
  SizeColorSelector: ({ selectedSize }: { selectedSize: string | null }) => (
    <div data-selected-size={selectedSize ?? ""} />
  ),
}));

vi.mock("@/features/products/components/TrustBadges", () => ({
  TrustBadges: () => null,
}));

vi.mock("@/store/buy-now.store", () => ({
  useBuyNowStore: (
    selector: (state: { setItem: ReturnType<typeof vi.fn> }) => unknown,
  ) => selector({ setItem: vi.fn() }),
}));

vi.mock("@/store/cart.store", () => ({
  useCartStore: (
    selector: (state: { addItem: ReturnType<typeof vi.fn> }) => unknown,
  ) => selector({ addItem: vi.fn() }),
}));

const discountedProduct: ProductDetail = {
  _id: "product-1",
  name: "Linen Shirt",
  slug: "linen-shirt",
  description: "Soft linen shirt",
  description_html: null,
  price: 1000,
  discount: 20,
  discounted_price: 800,
  category_id: "category-1",
  category: { name: "Shirts", slug: "shirts" },
  subcategory_id: null,
  subcategory: null,
  sizes: [],
  colors: [],
  images: [],
  is_active: true,
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

describe("ProductDetails", () => {
  it("does not preselect a size for the shopper", () => {
    const productWithSizes: ProductDetail = {
      ...discountedProduct,
      sizes: ["S", "M"],
    };

    const markup = renderToStaticMarkup(
      <ProductDetails product={productWithSizes} />,
    );

    expect(markup).toContain('data-selected-size=""');
    expect(markup).not.toContain('data-selected-size="S"');
  });

  it("renders one responsive product-name h1", () => {
    const markup = renderToStaticMarkup(
      <ProductDetails product={discountedProduct} />,
    );

    expect(markup.match(/<h1\b/g)).toHaveLength(1);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Linen Shirt</h1>");
    expect(markup).not.toContain("Linen Shirt</h2>");
  });

  it("uses an h2 for the product description section", () => {
    const markup = renderToStaticMarkup(
      <ProductDetails product={discountedProduct} />,
    );

    expect(markup).toContain("Description</h2>");
    expect(markup).not.toContain("Description</h3>");
  });

  it("renders the savings amount and percentage in the mobile layout", () => {
    const markup = renderToStaticMarkup(
      <ProductDetails product={discountedProduct} />,
    );

    expect(markup).toMatch(
      /<p class="[^"]*lg:hidden[^"]*"[^>]*>.*Save Tk 200 · 20% off<\/p>/s,
    );
  });

  it("hides the desktop savings message from the mobile layout", () => {
    const markup = renderToStaticMarkup(
      <ProductDetails product={discountedProduct} />,
    );

    expect(markup).toMatch(
      /<p class="(?=[^"]*\bhidden\b)(?=[^"]*\blg:flex\b)[^"]*"[^>]*>.*Save Tk 200 · 20% off<\/p>/s,
    );
  });

  it("shares the product link instead of the product description", () => {
    const productUrl = "https://www.minanclothing.com/products/linen-shirt";

    expect(createProductShareData(discountedProduct, productUrl)).toEqual({
      title: "Linen Shirt",
      text: productUrl,
      url: productUrl,
    });
  });
});
