import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), findOne: vi.fn(), summary: vi.fn(), full: vi.fn() }));

vi.mock("../models/Order.js", () => ({ Order: { find: mocks.find, findOne: mocks.findOne } }));
vi.mock("../utils/serializeCustomerOrder.js", () => ({
  serializeCustomerOrder: mocks.full,
  serializeCustomerOrderSummary: mocks.summary,
}));

import { CustomerOrderHistoryError, getCustomerOrderHistory, getOwnedCustomerOrder } from "./customerOrderHistory.service.js";

const customerId = "66f000000000000000000003";
const order = {
  _id: new Types.ObjectId("66f000000000000000000001"),
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  order_number: "MN-20260901-0001",
};

describe("customer Order history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.summary.mockReturnValue({ order_id: order.order_number });
    mocks.full.mockReturnValue({ order_id: order.order_number });
  });

  it("lists only Orders owned by the authenticated customer", async () => {
    const limit = vi.fn().mockResolvedValue([order]);
    mocks.find.mockReturnValue({ sort: vi.fn().mockReturnValue({ limit }) });

    await expect(getCustomerOrderHistory(customerId, { limit: 10 })).resolves.toEqual({
      orders: [{ order_id: order.order_number }],
      next_cursor: null,
    });
    expect(mocks.find).toHaveBeenCalledWith({ customer_id: customerId });
  });

  it("reads detail with the owner predicate and turns cross-account reads into 404", async () => {
    mocks.findOne.mockResolvedValueOnce(order).mockResolvedValueOnce(null);

    await expect(getOwnedCustomerOrder(customerId, order.order_number)).resolves.toEqual({ order_id: order.order_number });
    await expect(getOwnedCustomerOrder(customerId, order.order_number))
      .rejects.toEqual(new CustomerOrderHistoryError("Not found", 404));
    expect(mocks.findOne).toHaveBeenCalledWith({ customer_id: customerId, order_number: order.order_number });
  });
});
