import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ detail: vi.fn(), list: vi.fn() }));
vi.mock("../services/customerOrderHistory.service.js", () => ({
  CustomerOrderHistoryError: class CustomerOrderHistoryError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
  },
  getCustomerOrderHistory: mocks.list,
  getOwnedCustomerOrder: mocks.detail,
}));

import { customerOrderDetailHandler, customerOrderListHandler } from "./customerOrderHistory.controller.js";

function response() {
  const res = { json: vi.fn(), set: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe("customer Order history controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue({ orders: [], next_cursor: null });
    mocks.detail.mockResolvedValue({ order_id: "MN-20260901-0001" });
  });

  it("lists Orders only for the middleware-authenticated customer", async () => {
    const res = response();
    await customerOrderListHandler({ customer: { id: "customer-1" }, query: {} } as unknown as Request, res, vi.fn());

    expect(mocks.list).toHaveBeenCalledWith("customer-1", { limit: 10 });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  it("does not accept a browser-supplied customer identity for detail", async () => {
    const res = response();
    await customerOrderDetailHandler({
      customer: { id: "customer-1" },
      params: { orderNumber: "MN-20260901-0001" },
    } as unknown as Request, res, vi.fn());

    expect(mocks.detail).toHaveBeenCalledWith("customer-1", "MN-20260901-0001");
  });
});
