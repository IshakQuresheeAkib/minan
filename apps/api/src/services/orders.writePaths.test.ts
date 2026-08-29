import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildVerifiedCartSnapshotMock } = vi.hoisted(() => ({
  buildVerifiedCartSnapshotMock: vi.fn(),
}));

vi.mock("./checkoutCart.service.js", () => ({
  buildVerifiedCartSnapshot: buildVerifiedCartSnapshotMock,
}));

import { Order } from "../models/Order.js";
import { OrderCounter } from "../models/OrderCounter.js";
import { createOrLoadCheckoutOrder } from "./orders.service.js";

describe("new checkout Order tracking fields", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env.DELIVERY_FEE_BDT = "100";
    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60";
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "120";
  });

  it("stores canonical guest ownership fields and the frozen item image", async () => {
    vi.spyOn(Order, "findOne").mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);
    vi.spyOn(OrderCounter, "findOneAndUpdate").mockResolvedValue({ sequence: 1 } as never);
    buildVerifiedCartSnapshotMock.mockResolvedValue({
      items: [{
        product_id: new Types.ObjectId().toString(),
        name: "Oxford Shirt",
        image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
        price: 1200,
        original_price: 1500,
        discount: 20,
        size: "M",
        color: "Black",
        quantity: 1,
      }],
      total: 1200,
    });
    const persistenceReached = new Error("checkout Order reached persistence");
    const create = vi.spyOn(Order, "create").mockRejectedValue(persistenceReached);

    await expect(createOrLoadCheckoutOrder({
      name: "Test Customer",
      phone_number: "01700000000",
      email: "  Customer@Example.COM ",
      address: "Sylhet, Bangladesh",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      payment_method: "cod",
      cart_snapshot: {
        items: [{
          product_id: new Types.ObjectId().toString(),
          name: "Ignored client name",
          price: 1,
          size: "M",
          color: "Black",
          quantity: 1,
        }],
        total: 1,
      },
    }, "idempotency-hash")).rejects.toBe(persistenceReached);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: null,
      normalized_email: "customer@example.com",
      guest_access_version: 1,
      lines: [expect.objectContaining({
        image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
      })],
    }));
  });
});
