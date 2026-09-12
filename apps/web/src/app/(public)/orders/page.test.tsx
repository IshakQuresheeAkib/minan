import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getGuestOrder: vi.fn(() => new Promise(() => undefined)),
}));

vi.mock("@/features/order-tracking/lib/customerSession", () => ({
  restoreCustomerSession: vi.fn(),
}));

vi.mock("@/features/order-tracking/lib/orderTrackingApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/order-tracking/lib/orderTrackingApi")>(),
  getGuestOrder: apiMocks.getGuestOrder,
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
  it("server-renders a verified deep link from its query parameters", async () => {
    const page = await OrderTrackingPage({
      searchParams: Promise.resolve({
        access: "guest",
        order: "  MN-20260910-0001  ",
      }),
    });

    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Track another order");
    expect(markup).toContain("Loading your order");
    expect(markup).not.toContain("Find an order update");
  });
});
