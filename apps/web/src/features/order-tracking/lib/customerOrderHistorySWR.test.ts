import { afterEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getCustomerOrders: vi.fn(),
}));

vi.mock("@/features/order-tracking/lib/orderTrackingApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/order-tracking/lib/orderTrackingApi")>(),
  getCustomerOrders: apiMocks.getCustomerOrders,
}));

import {
  OrderTrackingApiError,
} from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderHistoryPage } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

import {
  createCustomerOrderHistoryKeyLoader,
  CustomerOrderHistoryPageError,
  fetchCustomerOrderHistoryPage,
  isCustomerOrderLoadMoreError,
} from "./customerOrderHistorySWR";

const page: CustomerOrderHistoryPage = {
  next_cursor: "opaque-cursor-123456",
  orders: [],
};

function setCustomerSession(accessToken: string, id = "customer-1"): void {
  useCustomerAuthStore.getState().setSession({
    accessToken,
    customer: { email: "buyer@example.com", id, is_active: true },
  });
}

describe("customer order history SWR helpers", () => {
  afterEach(() => {
    useCustomerAuthStore.getState().clearSession();
    apiMocks.getCustomerOrders.mockReset();
  });

  it("builds identity-scoped cursor keys and stops after the final page", () => {
    const getKey = createCustomerOrderHistoryKeyLoader("customer-1");

    expect(getKey(0, null)).toEqual(["customer-orders", "customer-1", null]);
    expect(getKey(1, page)).toEqual([
      "customer-orders",
      "customer-1",
      "opaque-cursor-123456",
    ]);
    expect(getKey(1, { ...page, next_cursor: null })).toBeNull();
    expect(createCustomerOrderHistoryKeyLoader(null)(0, null)).toBeNull();
  });

  it("clears the session for a current-token 401", async () => {
    setCustomerSession("current-token");
    const unauthorized = new OrderTrackingApiError("Unauthorized", 401);
    apiMocks.getCustomerOrders.mockRejectedValue(unauthorized);

    await expect(
      fetchCustomerOrderHistoryPage(["customer-orders", "customer-1", null]),
    ).rejects.toMatchObject({ originalError: unauthorized, cursor: null });

    expect(useCustomerAuthStore.getState().session).toBeNull();
  });

  it("does not clear a newer token after an older request returns 401", async () => {
    setCustomerSession("expired-token");
    let rejectRequest: (error: unknown) => void = () => undefined;
    const pending = new Promise<CustomerOrderHistoryPage>((_resolve, reject) => {
      rejectRequest = reject;
    });
    apiMocks.getCustomerOrders.mockReturnValue(pending);

    const request = fetchCustomerOrderHistoryPage([
      "customer-orders",
      "customer-1",
      null,
    ]);
    setCustomerSession("refreshed-token");
    const unauthorized = new OrderTrackingApiError("Unauthorized", 401);
    rejectRequest(unauthorized);

    await expect(request).rejects.toMatchObject({ originalError: unauthorized });
    expect(useCustomerAuthStore.getState().session?.accessToken).toBe(
      "refreshed-token",
    );
  });

  it("classifies the failed cursor page without mislabeling first-page errors", () => {
    const firstPageError = new CustomerOrderHistoryPageError(
      null,
      new Error("First page refresh failed"),
    );
    const cursorPageError = new CustomerOrderHistoryPageError(
      "opaque-cursor-123456",
      new Error("Cursor request failed"),
    );

    expect(isCustomerOrderLoadMoreError(cursorPageError)).toBe(true);
    expect(isCustomerOrderLoadMoreError(firstPageError)).toBe(false);
    expect(isCustomerOrderLoadMoreError(new Error("Unclassified error"))).toBe(false);
  });
});
