import { describe, expect, it } from "vitest";

import {
  orderCodSchema,
  orderCustomerUpdateSchema,
  orderItemsUpdateSchema,
  orderRefundSchema,
  orderTransitionSchema,
} from "./order.schemas.js";

describe("Order admin validation", () => {
  it("requires an explicit reason to waive COD", () => {
    expect(orderCodSchema.safeParse({ action: "waive", expected_revision: 1 }).success).toBe(false);
    expect(orderCodSchema.safeParse({ action: "waive", reason: "Customer approved waiver", expected_revision: 1 }).success).toBe(true);
  });

  it("requires confirmed, whole-money item edits", () => {
    const base = {
      items: [{ product_id: "507f1f77bcf86cd799439011", size: "M", color: "Black", quantity: 1 }],
      order_discount: 10,
      reason: "Customer approved the updated Order",
      expected_revision: 1,
    };
    expect(orderItemsUpdateSchema.safeParse(base).success).toBe(false);
    expect(orderItemsUpdateSchema.safeParse({ ...base, customer_confirmed: true }).success).toBe(true);
    expect(orderItemsUpdateSchema.safeParse({ ...base, order_discount: 10.5, customer_confirmed: true }).success).toBe(false);
  });

  it("rejects non-integer or zero refunds", () => {
    const base = { method: "cash", reason: "Returned merchandise", expected_revision: 1 };
    expect(orderRefundSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(orderRefundSchema.safeParse({ ...base, amount: 10.5 }).success).toBe(false);
    expect(orderRefundSchema.safeParse({ ...base, amount: 10 }).success).toBe(true);
  });

  it("reserves returned and exchanged statuses for their dedicated operations", () => {
    const base = { expected_revision: 1, reason: "Customer requested after delivery" };

    expect(orderTransitionSchema.safeParse({ ...base, status: "delivered" }).success).toBe(true);
    expect(orderTransitionSchema.safeParse({ ...base, status: "returned" }).success).toBe(false);
    expect(orderTransitionSchema.safeParse({ ...base, status: "exchanged" }).success).toBe(false);
  });

  it("requires Bangladesh-format phone numbers when editing a customer", () => {
    const base = { expected_revision: 1, reason: "Customer corrected their phone number" };

    expect(orderCustomerUpdateSchema.safeParse({ ...base, phone_number: "not-a-phone" }).success).toBe(false);
    expect(orderCustomerUpdateSchema.safeParse({ ...base, phone_number: "+8801700000000" }).success).toBe(true);
  });
});
