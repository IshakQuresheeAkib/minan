import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findOne: vi.fn(),
  full: vi.fn(),
  summary: vi.fn(),
}));

vi.mock("../models/Order.js", () => ({
  Order: { find: mocks.find, findOne: mocks.findOne },
}));

vi.mock("../utils/serializeCustomerOrder.js", () => ({
  serializeCustomerOrder: mocks.full,
  serializeCustomerOrderSummary: mocks.summary,
}));

import {
  PublicOrderTrackingError,
  searchPublicOrders,
} from "./publicOrderTracking.service.js";

const first = {
  _id: new Types.ObjectId("66f000000000000000000001"),
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  order_number: "MN-20260901-0001",
};
const second = {
  _id: new Types.ObjectId("66f000000000000000000002"),
  createdAt: new Date("2026-09-01T09:00:00.000Z"),
  order_number: "MN-20260901-0002",
};

describe("public order tracking search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.full.mockImplementation((order) => ({ full: order.order_number }));
    mocks.summary.mockImplementation((order) => ({ summary: order.order_number }));
  });

  it("returns the full allowlisted DTO for an exact Order number", async () => {
    mocks.findOne.mockResolvedValue(first);

    await expect(searchPublicOrders({ query: "mn-20260901-0001", limit: 10 })).resolves.toEqual({
      kind: "order",
      order: { full: "MN-20260901-0001" },
    });
    expect(mocks.findOne).toHaveBeenCalledWith({ order_number: "MN-20260901-0001" });
  });

  it("uses a phone-scoped stable query and limit plus one for lifetime history", async () => {
    const limit = vi.fn().mockResolvedValue([first, second]);
    const sort = vi.fn().mockReturnValue({ limit });
    mocks.find.mockReturnValue({ sort });

    const result = await searchPublicOrders({ query: "+880 1700-000000", limit: 1 });

    expect(mocks.find).toHaveBeenCalledWith({ normalized_phone: "01700000000" });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(limit).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      kind: "phone",
      orders: [{ summary: "MN-20260901-0001" }],
      next_cursor: expect.any(String),
    });
  });

  it("keeps cursor paging inside the normalized phone scope", async () => {
    const limit = vi.fn().mockResolvedValue([second]);
    mocks.find.mockReturnValue({ sort: vi.fn().mockReturnValue({ limit }) });

    await searchPublicOrders({
      query: "01700000000",
      cursor: Buffer.from(JSON.stringify({
        createdAt: "2026-09-01T10:00:00.000Z",
        id: "66f000000000000000000001",
      })).toString("base64url"),
      limit: 10,
    });

    expect(mocks.find).toHaveBeenCalledWith({
      normalized_phone: "01700000000",
      $or: [
        { createdAt: { $lt: new Date("2026-09-01T10:00:00.000Z") } },
        {
          createdAt: new Date("2026-09-01T10:00:00.000Z"),
          _id: { $lt: new Types.ObjectId("66f000000000000000000001") },
        },
      ],
    });
  });

  it("makes unsupported input and zero matches indistinguishable", async () => {
    mocks.findOne.mockResolvedValue(null);

    await expect(searchPublicOrders({ query: "MN-20260901-0001", limit: 10 }))
      .rejects.toEqual(new PublicOrderTrackingError("Not found", 404));
    await expect(searchPublicOrders({ query: "buyer@example.com", limit: 10 }))
      .rejects.toEqual(new PublicOrderTrackingError("Not found", 404));
  });
});
