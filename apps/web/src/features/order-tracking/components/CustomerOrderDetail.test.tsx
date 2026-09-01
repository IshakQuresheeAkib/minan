import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCustomerAuthStore } from "@/store/customer-auth.store";

const apiMocks = vi.hoisted(() => ({
  refreshCustomerSession: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      effect();
    },
  };
});

vi.mock("@/features/order-tracking/lib/orderTrackingApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/order-tracking/lib/orderTrackingApi")>(),
  refreshCustomerSession: apiMocks.refreshCustomerSession,
}));

import { CustomerOrderDetail } from "./CustomerOrderDetail";

describe("CustomerOrderDetail", () => {
  afterEach(() => {
    apiMocks.refreshCustomerSession.mockReset();
    useCustomerAuthStore.getState().clearSession();
  });

  it("restores the customer session when the direct detail page starts unknown", async () => {
    apiMocks.refreshCustomerSession.mockResolvedValue({
      customer: { email: "buyer@example.com", id: "customer-1", is_active: true },
      accessToken: "restored-access-token",
    });

    renderToStaticMarkup(<CustomerOrderDetail orderNumber="MN-20260901-0001" />);
    await Promise.resolve();
    await Promise.resolve();

    expect(useCustomerAuthStore.getState()).toMatchObject({
      session: { accessToken: "restored-access-token" },
      status: "authenticated",
    });
  });
});
