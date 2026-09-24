import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/store/cart.store", () => ({
  useCartStore: () => vi.fn(),
}));

vi.mock("@/store/buy-now.store", () => ({
  useBuyNowStore: () => vi.fn(),
}));

import type { PaymentResult } from "@/features/checkout/types";
import { PaymentResultClient } from "./PaymentResultClient";

describe("PaymentResultClient", () => {
  const completedResult: PaymentResult = {
    state: "completed",
    message: "Your payment succeeded.",
    order_number: "MN-20260923-0042",
    payment_method: "cod",
    fee_paid: 120,
    cod_due: 1500,
    checkout_source: "cart",
  };

  it("points guest order tracking CTA to public order lookup flow with updated copy", () => {
    const markup = renderToStaticMarkup(
      <PaymentResultClient result={completedResult} />,
    );

    expect(markup).toContain("Track this order");
    expect(markup).toContain(
      "Track your order anytime using your Order number or the phone number provided at checkout.",
    );
    expect(markup).not.toContain("email code");
    expect(markup).not.toContain("verification");

    // "Track order" button links to public /orders
    expect(markup).toContain('href="/orders"');

    // "Sign in to Orders" button links to customer login redirecting to /account/orders
    expect(markup).toContain('href="/account/login?next=%2Faccount%2Forders"');
  });

  it("renders non-completed states without guest tracking section", () => {
    const failedResult: PaymentResult = {
      state: "failed",
      message: "Payment was declined.",
      retry_token: "retry-token-xyz",
      checkout_source: "cart",
    };

    const markup = renderToStaticMarkup(
      <PaymentResultClient result={failedResult} />,
    );

    expect(markup).not.toContain("Track this order");
    expect(markup).toContain("Payment unsuccessful");
  });
});
