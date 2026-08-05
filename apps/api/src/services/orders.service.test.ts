import { describe, expect, it } from "vitest";

import type { OrderLine } from "../models/Order.js";
import { allocateOrderDiscount, buildItemSignature, calculateFinancials, normalizeBangladeshPhone } from "./orders.service.js";

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
    const result = calculateFinancials({ lines: [line({ quantity: 2 })], orderDiscount: 20, deliveryFee: 100, exchangeCreditApplied: 30 });
    expect(result).toMatchObject({ merchandise_subtotal: 200, merchandise_total: 180, delivery_fee: 100, overall_order_value: 280, cod_due: 150 });
  });
});
