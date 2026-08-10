import { describe, expect, it } from "vitest";

import { Order } from "../models/Order.js";
import { serializeOrder } from "./serializeOrder.js";

describe("serializeOrder", () => {
  it("serializes Mongoose order-line subdocuments as plain API fields", () => {
    const createdAt = new Date("2026-08-05T00:00:00.000Z");
    const order = new Order({
      order_number: "MINAN-TEST-1",
      name: "Test Customer",
      phone_number: "+8801700000000",
      normalized_phone: "8801700000000",
      email: "customer@example.com",
      address: "Dhaka",
      lines: [{
        line_id: "line-1",
        product_id: "product-1",
        name: "Test Shirt",
        unit_price: 1200,
        original_price: 1500,
        product_discount: 20,
        size: "M",
        color: "Black",
        quantity: 1,
        allocated_order_discount: 0,
        returned_quantity: 0,
        credited_amount: 0,
      }],
      item_signature: "product-1:M:Black:1",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      status: "new",
      financials: {
        merchandise_subtotal: 1200,
        order_discount: 0,
        merchandise_total: 1200,
        delivery_fee: 100,
        overall_order_value: 1300,
        merchandise_paid_online: 0,
        exchange_credit_applied: 0,
        cod_due: 1200,
        cod_collected: 0,
        merchandise_refunded: 0,
        exchange_credit_issued: 0,
      },
      delivery_fee_status: "awaiting",
      cod_status: "due",
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    });

    const serialized = serializeOrder(order, [], true);

    expect(serialized.lines[0]).toEqual({
      line_id: "line-1",
      product_id: "product-1",
      name: "Test Shirt",
      unit_price: 1200,
      original_price: 1500,
      product_discount: 20,
      size: "M",
      color: "Black",
      quantity: 1,
      allocated_order_discount: 0,
      returned_quantity: 0,
      credited_amount: 0,
    });
    expect(serialized.shipping_zone).toBe("inside_sylhet");

    order.shipping_zone = undefined;
    expect(serializeOrder(order, [], true).shipping_zone).toBeNull();
  });
});
