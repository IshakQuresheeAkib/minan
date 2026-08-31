import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCustomerOrder,
  getGuestOrder,
  logoutCustomer,
  requestGuestOrderOtp,
  verifyGuestOrderOtp,
} from "./orderTrackingApi";

const fetchMock = vi.fn();

describe("order-tracking API boundary", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("requests and verifies guest proof without sending it through the browser", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ accepted: true }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ verified: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestGuestOrderOtp({
      email: "buyer@example.com",
      orderNumber: "MN-20260831-0001",
    });
    await verifyGuestOrderOtp({
      email: "buyer@example.com",
      orderNumber: "MN-20260831-0001",
      otp: "123456",
    });

    const requestCall = fetchMock.mock.calls[0];
    const verifyCall = fetchMock.mock.calls[1];
    expect(requestCall?.[0]).toBe("/api/guest-order-access/otp/request");
    expect(requestCall?.[1]).toEqual(expect.objectContaining({
      body: JSON.stringify({
        email: "buyer@example.com",
        order_number: "MN-20260831-0001",
      }),
      credentials: "include",
      method: "POST",
    }));
    expect((requestCall?.[1] as RequestInit).headers).toBeInstanceOf(Headers);
    expect(((requestCall?.[1] as RequestInit).headers as Headers).get("X-Requested-With")).toBe("XMLHttpRequest");
    expect(verifyCall?.[0]).toBe("/api/guest-order-access/otp/verify");
    expect(verifyCall?.[1]).toEqual(expect.objectContaining({ credentials: "include", method: "POST" }));
  });

  it("uses separate guest-proof and customer-owned-order reads", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ order: { order_id: "MN-1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ order: { order_id: "MN-1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await getGuestOrder("MN-1");
    await getCustomerOrder("MN-1", "customer-access-token");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/guest-order-access/orders/MN-1",
      expect.objectContaining({ credentials: "include" }),
    );
    const customerCall = fetchMock.mock.calls[1];
    expect(customerCall?.[0]).toBe("/api/customer-orders/MN-1");
    expect(((customerCall?.[1] as RequestInit).headers as Headers).get("Authorization")).toBe("Bearer customer-access-token");
  });

  it("accepts the customer logout endpoint's empty success response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutCustomer()).resolves.toBeUndefined();
  });
});
