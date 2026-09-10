import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type TestCartItem = {
  color: string;
  discount: number;
  imageUrl: string;
  isAvailable: boolean;
  lineId: string;
  name: string;
  originalPrice: number;
  price: number;
  quantity: number;
  size: string;
};

const cartState = vi.hoisted(() => ({
  hasHydrated: true,
  items: [] as TestCartItem[],
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
}));

vi.mock("@/features/products/hooks/useCartPricingSync", () => ({
  useCartPricingSync: vi.fn(),
}));

vi.mock("@/store/cart.store", () => ({
  useCartStore: (selector: (state: typeof cartState) => unknown) =>
    selector(cartState),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    href,
    prefetch,
    text,
  }: React.PropsWithChildren<{
    href?: string;
    prefetch?: boolean;
    text?: React.ReactNode;
  }>) =>
    href ? (
      <a
        href={href}
        data-prefetch={prefetch === false ? "disabled" : "default"}
      >
        {text ?? children}
      </a>
    ) : (
      <button type="button">{text ?? children}</button>
    ),
}));

import { CartPageContent } from "@/features/cart/components/CartPageContent";

describe("CartPageContent route prefetching", () => {
  beforeEach(() => {
    cartState.items = [];
  });

  it("does not prefetch products from the empty-cart call to action", () => {
    const markup = renderToStaticMarkup(<CartPageContent />);

    expect(markup).toContain(
      '<a href="/products" data-prefetch="disabled">Browse products</a>',
    );
  });

  it("does not prefetch checkout from the populated-cart call to action", () => {
    cartState.items = [
      {
        color: "Black",
        discount: 0,
        imageUrl: "",
        isAvailable: true,
        lineId: "product-1:M:Black",
        name: "Polo Shirt",
        originalPrice: 1032,
        price: 1032,
        quantity: 1,
        size: "M",
      },
    ];

    const markup = renderToStaticMarkup(<CartPageContent />);

    expect(markup).toContain(
      '<a href="/checkout" data-prefetch="disabled">Proceed to checkout</a>',
    );
  });
});
