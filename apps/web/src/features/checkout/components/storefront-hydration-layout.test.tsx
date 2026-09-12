import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cartState = vi.hoisted(() => ({
  hasHydrated: false,
  items: [],
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
}));

const buyNowState = vi.hoisted(() => ({
  hasHydrated: false,
  item: null,
}));

vi.mock("@/features/products/hooks/useCartPricingSync", () => ({
  useCartPricingSync: vi.fn(),
}));

vi.mock("@/features/products/hooks/useBuyNowPricingSync", () => ({
  useBuyNowPricingSync: vi.fn(),
}));

vi.mock("@/store/cart.store", () => ({
  useCartStore: (selector: (state: typeof cartState) => unknown) =>
    selector(cartState),
}));

vi.mock("@/store/buy-now.store", () => ({
  useBuyNowStore: (selector: (state: typeof buyNowState) => unknown) =>
    selector(buyNowState),
}));

import { CartPageContent } from "@/features/cart/components/CartPageContent";
import { BuyNowCheckoutClient } from "@/features/checkout/components/BuyNowCheckoutClient";
import { CheckoutClient } from "@/features/checkout/components/CheckoutClient";

const stableViewportClasses = [
  "min-h-[calc(100dvh-10rem)]",
  "lg:min-h-[calc(100dvh-5rem)]",
];

function expectStableViewportFrame(markup: string): void {
  for (const className of stableViewportClasses) {
    expect(markup).toContain(className);
  }
}

function expectMobileSummaryDeferred(markup: string): void {
  expect(markup).toContain("hidden h-fit");
  expect(markup).toContain("lg:block");
}

describe("persisted storefront page hydration", () => {
  beforeEach(() => {
    cartState.hasHydrated = false;
    buyNowState.hasHydrated = false;
  });

  it("keeps the cart footer below the viewport before and after empty-state hydration", () => {
    const pendingMarkup = renderToStaticMarkup(<CartPageContent />);
    cartState.hasHydrated = true;
    const emptyMarkup = renderToStaticMarkup(<CartPageContent />);

    expectStableViewportFrame(pendingMarkup);
    expectStableViewportFrame(emptyMarkup);
    expectMobileSummaryDeferred(pendingMarkup);
    expect(pendingMarkup).toContain(">Cart</h1>");
  });

  it("keeps the checkout footer below the viewport before and after empty-state hydration", () => {
    const pendingMarkup = renderToStaticMarkup(<CheckoutClient config={null} />);
    cartState.hasHydrated = true;
    const emptyMarkup = renderToStaticMarkup(<CheckoutClient config={null} />);

    expectStableViewportFrame(pendingMarkup);
    expectStableViewportFrame(emptyMarkup);
    expectMobileSummaryDeferred(pendingMarkup);
    expect(pendingMarkup).toContain(">Checkout</h1>");
  });

  it("keeps the buy-now footer below the viewport before and after empty-state hydration", () => {
    const pendingMarkup = renderToStaticMarkup(
      <BuyNowCheckoutClient config={null} />,
    );
    buyNowState.hasHydrated = true;
    const emptyMarkup = renderToStaticMarkup(
      <BuyNowCheckoutClient config={null} />,
    );

    expectStableViewportFrame(pendingMarkup);
    expectStableViewportFrame(emptyMarkup);
    expectMobileSummaryDeferred(pendingMarkup);
    expect(pendingMarkup).toContain(">Buy Now Checkout</h1>");
  });
});
