import mongoose, { type ClientSession, Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildVerifiedCartSnapshotMock } = vi.hoisted(() => ({
  buildVerifiedCartSnapshotMock: vi.fn(),
}));

vi.mock("./checkoutCart.service.js", () => ({
  buildVerifiedCartSnapshot: buildVerifiedCartSnapshotMock,
}));

import { Order } from "../models/Order.js";
import { OrderCounter } from "../models/OrderCounter.js";
import { NotificationOutbox } from "../models/NotificationOutbox.js";
import { createOrLoadCheckoutOrder } from "./orders.service.js";

const DB_SESSION = {} as ClientSession;

describe("new checkout Order tracking fields", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    process.env.DELIVERY_FEE_BDT = "100";
    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60";
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "120";
    vi.spyOn(mongoose.connection, "transaction").mockImplementation(async (work) => work(DB_SESSION));
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

    expect(create).toHaveBeenCalledWith([expect.objectContaining({
      customer_id: null,
      normalized_email: "customer@example.com",
      guest_access_version: 1,
      lines: [expect.objectContaining({
        image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
      })],
    })], { session: DB_SESSION });
  });

  it("commits a new checkout Order and its receipt outbox entry in one transaction", async () => {
    const orderId = new Types.ObjectId();
    const createdAt = new Date("2026-09-01T00:00:00.000Z");
    vi.spyOn(Order, "findOne").mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);
    vi.spyOn(OrderCounter, "findOneAndUpdate").mockResolvedValue({ sequence: 1 } as never);
    vi.spyOn(Order, "create").mockResolvedValue([{
      _id: orderId,
      order_number: "MN-20260901-0001",
      email: "customer@example.com",
      normalized_phone: "01700000000",
      item_signature: "signature",
      createdAt,
      status: "new",
      activity: [{ actor_type: "customer", event: "order_created", created_at: createdAt }],
      expected_delivery_date: undefined,
      courier_name: undefined,
      tracking_number: undefined,
      lines: [],
      shipping_zone: "inside_sylhet",
      payment_method: "cod",
      revision: 1,
      financials: { merchandise_subtotal: 0, order_discount: 0, merchandise_total: 0, delivery_fee: 60, overall_order_value: 60 },
    }] as never);
    vi.spyOn(Order, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    } as never);
    const outbox = vi.spyOn(NotificationOutbox, "updateOne").mockResolvedValue({ upsertedCount: 1 } as never);
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

    await createOrLoadCheckoutOrder({
      name: "Test Customer",
      phone_number: "01700000000",
      email: "customer@example.com",
      address: "Sylhet, Bangladesh",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      payment_method: "cod",
      cart_snapshot: { items: [{ product_id: new Types.ObjectId().toString(), name: "Ignored", price: 1, size: "M", color: "Black", quantity: 1 }], total: 1 },
    }, "idempotency-hash");

    expect(mongoose.connection.transaction).toHaveBeenCalledOnce();
    expect(Order.create).toHaveBeenCalledWith(
      [expect.objectContaining({ order_number: "MN-20260901-0001" })],
      { session: DB_SESSION },
    );
    expect(outbox).toHaveBeenCalledWith(
      { dedupe_key: `${orderId}:order_created:1` },
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ event_type: "order_created" }) }),
      { upsert: true, session: DB_SESSION },
    );
  });
});
