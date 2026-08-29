import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { Order } from "./Order.js";

function validOrder() {
  return {
    order_number: "MN-20260830-0001",
    name: "Test Customer",
    phone_number: "01700000000",
    normalized_phone: "01700000000",
    email: "Customer@Example.com",
    normalized_email: "customer@example.com",
    address: "Sylhet, Bangladesh",
    lines: [{
      line_id: "line-1",
      product_id: new Types.ObjectId().toString(),
      name: "Test Shirt",
      unit_price: 1200,
      original_price: 1200,
      product_discount: 0,
      size: "M",
      color: "Black",
      quantity: 1,
      allocated_order_discount: 0,
      returned_quantity: 0,
      credited_amount: 0,
    }],
    item_signature: "signature",
    checkout_source: "cart",
    status: "new",
    financials: {
      merchandise_subtotal: 1200,
      order_discount: 0,
      merchandise_total: 1200,
      delivery_fee: 60,
      overall_order_value: 1260,
      merchandise_paid_online: 0,
      exchange_credit_applied: 0,
      cod_due: 1200,
      cod_collected: 0,
      merchandise_refunded: 0,
      exchange_credit_issued: 0,
    },
    delivery_fee_status: "awaiting",
    cod_status: "due",
  };
}

describe("Order tracking domain contract", () => {
  it("defaults new Orders to unclaimed guest access version one", async () => {
    const order = new Order(validOrder());

    await order.validate();

    expect(order.customer_id).toBeNull();
    expect(order.guest_access_version).toBe(1);
  });

  it("indexes ownership and normalized email query paths", () => {
    const indexes = Order.schema.indexes().map(([fields]) => fields);

    expect(indexes).toContainEqual({ customer_id: 1, createdAt: -1 });
    expect(indexes).toContainEqual({ normalized_email: 1, createdAt: -1 });
  });

  it("accepts calendar dates at UTC midnight and rejects timestamps", async () => {
    const dateOnly = new Order({
      ...validOrder(),
      expected_delivery_date: new Date("2026-09-05T00:00:00.000Z"),
    });
    const timestamp = new Order({
      ...validOrder(),
      order_number: "MN-20260830-0002",
      expected_delivery_date: new Date("2026-09-05T12:30:00.000Z"),
    });

    await expect(dateOnly.validate()).resolves.toBeUndefined();
    await expect(timestamp.validate()).rejects.toThrow("calendar date");
  });

  it("limits public customer activity notes to 500 characters", async () => {
    const accepted = new Order({
      ...validOrder(),
      activity: [{
        actor_type: "admin",
        event: "status_confirmed",
        customer_note: "a".repeat(500),
        created_at: new Date(),
      }],
    });
    const rejected = new Order({
      ...validOrder(),
      order_number: "MN-20260830-0003",
      activity: [{
        actor_type: "admin",
        event: "status_confirmed",
        customer_note: "a".repeat(501),
        created_at: new Date(),
      }],
    });

    await expect(accepted.validate()).resolves.toBeUndefined();
    await expect(rejected.validate()).rejects.toThrow();
  });
});
