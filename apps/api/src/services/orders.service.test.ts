import { describe, expect, it } from "vitest";

import { Order, type OrderLine } from "../models/Order.js";
import {
  allocateOrderDiscount,
  buildItemSignature,
  calculateFinancials,
  checkoutRequestMatchesOrder,
  normalizeBangladeshPhone,
} from "./orders.service.js";

function line(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    line_id: "line", product_id: "507f1f77bcf86cd799439011", name: "Shirt",
    unit_price: 100, original_price: 120, product_discount: 17, size: "M", color: "Black",
    quantity: 1, allocated_order_discount: 0, returned_quantity: 0, credited_amount: 0,
    ...overrides,
  };
}

describe("Order financial snapshots", () => {
  it("normalizes common Bangladesh phone formats", () => {
    expect(normalizeBangladeshPhone("+880 1700-000000")).toBe("01700000000");
    expect(normalizeBangladeshPhone("1700000000")).toBe("01700000000");
  });

  it("builds the same signature regardless of line order", () => {
    const first = line({ product_id: "a", size: "M", color: "Black" });
    const second = line({ product_id: "b", size: "L", color: "Blue" });
    expect(buildItemSignature([first, second])).toBe(buildItemSignature([second, first]));
  });

  it("allocates every discount taka without rounding drift", () => {
    const allocated = allocateOrderDiscount([line({ quantity: 2 }), line({ line_id: "two", unit_price: 50 })], 17);
    expect(allocated.reduce((sum, item) => sum + item.allocated_order_discount, 0)).toBe(17);
  });

  it("keeps delivery fees outside COD merchandise and refund accounting", () => {
    const inside = calculateFinancials({ lines: [line({ quantity: 2 })], orderDiscount: 20, deliveryFee: 60, exchangeCreditApplied: 30 });
    const outside = calculateFinancials({ lines: [line({ quantity: 2 })], orderDiscount: 20, deliveryFee: 120, exchangeCreditApplied: 30 });

    expect(inside).toMatchObject({ merchandise_subtotal: 200, merchandise_total: 180, delivery_fee: 60, overall_order_value: 240, cod_due: 150 });
    expect(outside).toMatchObject({ merchandise_subtotal: 200, merchandise_total: 180, delivery_fee: 120, overall_order_value: 300, cod_due: 150 });
  });

  it("treats a changed shipping zone as an idempotency conflict", () => {
    const order = new Order({
      name: "MINAN Customer",
      phone_number: "01700000000",
      normalized_phone: "01700000000",
      email: "customer@example.com",
      address: "Sylhet, Bangladesh",
      customer_notes: "",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      lines: [{ product_id: "507f1f77bcf86cd799439011", size: "M", color: "Black", quantity: 1 }],
    });
    const input = {
      name: "MINAN Customer",
      phone_number: "01700000000",
      email: "customer@example.com",
      address: "Sylhet, Bangladesh",
      notes: "",
      checkout_source: "cart" as const,
      shipping_zone: "inside_sylhet" as const,
      cart_snapshot: {
        items: [{ product_id: "507f1f77bcf86cd799439011", name: "Shirt", price: 100, size: "M", color: "Black", quantity: 1 }],
        total: 100,
      },
    };

    expect(checkoutRequestMatchesOrder(input, order)).toBe(true);
    expect(checkoutRequestMatchesOrder({
      ...input,
      shipping_zone: "outside_sylhet",
    }, order)).toBe(false);
  });
});
