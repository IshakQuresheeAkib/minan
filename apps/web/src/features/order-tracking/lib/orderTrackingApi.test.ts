import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCustomerOrder,
  getCustomerOrders,
  logoutCustomer,
  searchPublicOrders,
} from "./orderTrackingApi";

const fetchMock = vi.fn();

describe("order-tracking API boundary", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("uses separate public and customer-owned Order reads", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { kind: "order", order: { order_id: "MN-1" } } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ order: { order_id: "MN-1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await searchPublicOrders("MN-1");
    await getCustomerOrder("MN-1", "customer-access-token");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/order-tracking/search",
      expect.objectContaining({
        body: JSON.stringify({ query: "MN-1" }),
        credentials: "include",
        method: "POST",
      }),
    );
    const customerCall = fetchMock.mock.calls[1];
    expect(customerCall?.[0]).toBe("/api/customer-orders/MN-1");
    expect(((customerCall?.[1] as RequestInit).headers as Headers).get("Authorization")).toBe("Bearer customer-access-token");
  });

  it("uses customer tokens only for account-history pagination", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { orders: [], next_cursor: null } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await getCustomerOrders("customer-access-token", "opaque-cursor");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customer-orders?cursor=opaque-cursor",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
    expect(((fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers).get("Authorization")).toBe("Bearer customer-access-token");
  });

  it("accepts the customer logout endpoint's empty success response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutCustomer()).resolves.toBeUndefined();
  });
});
