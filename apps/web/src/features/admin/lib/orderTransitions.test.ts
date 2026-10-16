import { describe, expect, it } from "vitest";
import { getAllowedTransitions } from "./orderTransitions";
import type { AdminOrder } from "../types";

function createMockOrder(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    _id: "order_123",
    order_number: "ORD-001",
    name: "Customer",
    phone_number: "01700000000",
    email: "customer@example.com",
    address: "Dhaka",
    customer_notes: null,
    lines: [],
    checkout_source: "cart",
    shipping_zone: "inside_sylhet",
    payment_method: "cod",
    settled_payment_attempt_id: null,
    status: "new",
    held_from_status: null,
    financials: {
      merchandise_subtotal: 1000,
      order_discount: 0,
      merchandise_total: 1000,
      delivery_fee: 100,
      overall_order_value: 1100,
      merchandise_paid_online: 0,
      exchange_credit_applied: 0,
      cod_due: 1000,
      cod_collected: 0,
      merchandise_refunded: 0,
      exchange_credit_issued: 0,
    },
    delivery_fee_status: "awaiting",
    cod_status: "due",
    courier_name: null,
    tracking_number: null,
    shipped_at: null,
    delivered_at: null,
    duplicate_order_ids: [],
    duplicate_review_state: "none",
    exchange_source_order_id: null,
    exchange_replacement_order_id: null,
    revision: 1,
    financial_review_required: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getAllowedTransitions", () => {
  it("locks terminal orders (cancelled, returned, exchanged)", () => {
    for (const status of ["cancelled", "returned", "exchanged"] as const) {
      const result = getAllowedTransitions(createMockOrder({ status }));
      expect(result.isLocked).toBe(true);
      expect(result.transitions).toHaveLength(0);
    }
  });

  it("locks delivered orders and points to dedicated return/exchange workflows", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "delivered" }));
    expect(result.isLocked).toBe(true);
    expect(result.lockedReason).toContain("Returns and exchanges use the dedicated workflows");
    expect(result.transitions).toHaveLength(0);
  });

  it("handles new orders with unpaid delivery fee", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "new", delivery_fee_status: "awaiting" }));
    expect(result.isLocked).toBe(false);
    const confirm = result.transitions.find((t) => t.status === "confirmed");
    expect(confirm?.disabled).toBe(true);
    expect(confirm?.disabledReason).toContain("Delivery fee must be paid");
  });

  it("handles new orders with paid delivery fee", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "new", delivery_fee_status: "paid" }));
    expect(result.isLocked).toBe(false);
    const confirm = result.transitions.find((t) => t.status === "confirmed");
    expect(confirm?.disabled).toBe(false);
  });

  it("handles processing orders without courier info", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "processing", courier_name: null, tracking_number: null }));
    expect(result.isLocked).toBe(false);
    const shipped = result.transitions.find((t) => t.status === "shipped");
    expect(shipped?.disabled).toBe(true);
    expect(shipped?.disabledReason).toContain("Courier name and tracking number");
  });

  it("handles processing orders with courier info", () => {
    const result = getAllowedTransitions(createMockOrder({
      status: "processing",
      courier_name: "Steadfast",
      tracking_number: "ST12345",
    }));
    expect(result.isLocked).toBe(false);
    const shipped = result.transitions.find((t) => t.status === "shipped");
    expect(shipped?.disabled).toBe(false);
  });

  it("handles on_hold orders resuming to held_from_status", () => {
    const result = getAllowedTransitions(createMockOrder({
      status: "on_hold",
      held_from_status: "processing",
    }));
    expect(result.isLocked).toBe(false);
    expect(result.transitions.map((t) => t.status)).toEqual(["processing", "cancelled"]);
  });

  it("handles shipped orders only allowing transition to delivered", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "shipped" }));
    expect(result.isLocked).toBe(false);
    expect(result.transitions.map((t) => t.status)).toEqual(["delivered"]);
  });

  it("allows skipping from new to processing with required reason", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "new" }));
    const processing = result.transitions.find((t) => t.status === "processing");
    expect(processing).toBeDefined();
    expect(processing?.requiresReason).toBe(true);
    expect(processing?.disabled).toBeFalsy();
  });

  it("allows reverting from confirmed to new with required reason", () => {
    const result = getAllowedTransitions(createMockOrder({ status: "confirmed" }));
    const newTransition = result.transitions.find((t) => t.status === "new");
    expect(newTransition).toBeDefined();
    expect(newTransition?.requiresReason).toBe(true);
    expect(newTransition?.disabled).toBeFalsy();
  });

  it("allows reverting from processing to confirmed or new with required reason", () => {
    const result = getAllowedTransitions(createMockOrder({
      status: "processing",
      delivery_fee_status: "paid",
    }));
    const confirmed = result.transitions.find((t) => t.status === "confirmed");
    expect(confirmed).toBeDefined();
    expect(confirmed?.requiresReason).toBe(true);
    expect(confirmed?.disabled).toBe(false);

    const newTransition = result.transitions.find((t) => t.status === "new");
    expect(newTransition).toBeDefined();
    expect(newTransition?.requiresReason).toBe(true);
    expect(newTransition?.disabled).toBeFalsy();
  });

  it("disables reverting from processing to confirmed when delivery fee is unpaid", () => {
    const result = getAllowedTransitions(createMockOrder({
      status: "processing",
      delivery_fee_status: "awaiting",
    }));
    const confirmed = result.transitions.find((t) => t.status === "confirmed");
    expect(confirmed).toBeDefined();
    expect(confirmed?.disabled).toBe(true);
    expect(confirmed?.disabledReason).toContain("Delivery fee must be paid");
  });
});

