import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Order } from "../models/Order.js";
import { updateOrderTracking } from "./adminOrders.service.js";

describe("admin Order tracking writes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the date at UTC midnight and attaches the public note only to the customer timeline event", async () => {
    const id = new Types.ObjectId();
    const now = new Date("2026-09-01T08:00:00.000Z");
    vi.spyOn(Order, "findOneAndUpdate").mockResolvedValue({
      _id: id,
      order_number: "MN-20260901-0001",
      status: "confirmed",
      activity: [],
      createdAt: now,
      updatedAt: now,
      lines: [],
      financials: { merchandise_subtotal: 0, order_discount: 0, merchandise_total: 0, delivery_fee: 0, overall_order_value: 0, merchandise_paid_online: 0, exchange_credit_applied: 0, cod_due: 0, cod_collected: 0, merchandise_refunded: 0, exchange_credit_issued: 0 },
      duplicate_order_ids: [],
      duplicate_review_state: "none",
      delivery_fee_status: "paid",
      cod_status: "not_required",
      checkout_source: "cart",
      revision: 5,
      financial_review_required: false,
      refunds: [],
    } as never);

    await updateOrderTracking(String(id), {
      expected_delivery_date: "2026-09-05",
      public_note: "Your order is expected this Friday.",
      expected_revision: 4,
    }, { id: new Types.ObjectId().toString(), email: "admin@example.com" });

    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: String(id), revision: 4 },
      expect.objectContaining({
        $set: { expected_delivery_date: new Date("2026-09-05T00:00:00.000Z") },
        $push: {
          activity: expect.objectContaining({
            event: "tracking_updated",
            customer_note: "Your order is expected this Friday.",
          }),
        },
      }),
      expect.objectContaining({ new: true, runValidators: true }),
    );
  });
});
