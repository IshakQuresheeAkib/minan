import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/order-tracking/lib/customerSession", () => ({
  restoreCustomerSession: vi.fn(),
}));

vi.mock("@/store/customer-auth.store", () => ({
  useCustomerAuthStore: () => ({
    clearSession: vi.fn(),
    session: null,
    status: "anonymous",
  }),
}));

import OrderTrackingPage from "./page";

describe("OrderTrackingPage", () => {
  it("server-renders an account-order deep link from its query parameters", async () => {
    const page = await OrderTrackingPage({
      searchParams: Promise.resolve({
        order: "  MN-20260910-0001  ",
      }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Track another order");
    expect(markup).toContain("Sign in to view this order");
    expect(markup).not.toContain("Find an order update");
  });
});
