import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { Order } from "../models/Order.js";
import { serializeCustomerOrder } from "./serializeCustomerOrder.js";

describe("serializeCustomerOrder", () => {
  it("returns only the customer tracking allowlist and drops internal data", () => {
    const createdAt = new Date("2026-08-30T06:00:00.000Z");
    const customerId = new Types.ObjectId();
    const order = new Order({
      order_number: "MN-20260830-0001",
      customer_id: customerId,
      name: "Private Customer",
      phone_number: "01700000000",
      normalized_phone: "01700000000",
      email: "private@example.com",
      normalized_email: "private@example.com",
      address: "A private street address",
      customer_notes: "Private checkout note",
      lines: [{
        line_id: "line-1",
        product_id: new Types.ObjectId().toString(),
        name: "Oxford Shirt",
        image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
        unit_price: 1200,
        original_price: 1500,
        product_discount: 20,
        size: "M",
        color: "Black",
        quantity: 2,
        allocated_order_discount: 100,
        returned_quantity: 0,
        credited_amount: 0,
      }],
      item_signature: "private-signature",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      payment_method: "cod",
      settled_payment_attempt_id: new Types.ObjectId(),
      status: "confirmed",
      financials: {
        merchandise_subtotal: 2400,
        order_discount: 100,
        merchandise_total: 2300,
        delivery_fee: 60,
        overall_order_value: 2360,
        merchandise_paid_online: 0,
        exchange_credit_applied: 0,
        cod_due: 2300,
        cod_collected: 0,
        merchandise_refunded: 0,
        exchange_credit_issued: 0,
      },
      delivery_fee_status: "paid",
      cod_status: "due",
      courier_name: "Pathao",
      tracking_number: "TRACK-123",
      expected_delivery_date: new Date("2026-09-03T00:00:00.000Z"),
      duplicate_order_ids: [new Types.ObjectId()],
      duplicate_review_state: "pending",
      revision: 4,
      activity: [
        {
          actor_type: "customer",
          event: "order_created",
          reason: "Internal creation reason",
          customer_note: "A customer cannot publish a tracking note",
          metadata: { payment_id: "private-provider-id" },
          created_at: createdAt,
        },
        {
          actor_type: "admin",
          admin_id: new Types.ObjectId().toString(),
          admin_email: "admin@minan.com",
          event: "status_confirmed",
          reason: "Internal confirmation reason",
          customer_note: "Your order is confirmed and being prepared.",
          created_at: new Date("2026-08-30T08:00:00.000Z"),
        },
        {
          actor_type: "admin",
          event: "note_added",
          reason: "Never show this internal note",
          created_at: new Date("2026-08-30T09:00:00.000Z"),
        },
      ],
      refunds: [{
        amount: 100,
        method: "bkash_manual",
        reference: "private-refund-reference",
        reason: "Private refund reason",
        admin_id: new Types.ObjectId().toString(),
        admin_email: "admin@minan.com",
        created_at: createdAt,
      }],
      financial_review_required: true,
      createdAt,
      updatedAt: createdAt,
    });

    expect(serializeCustomerOrder(order)).toEqual({
      order_id: "MN-20260830-0001",
      created_at: "2026-08-30T06:00:00.000Z",
      current_stage: {
        code: "confirmed",
        label: "Confirmed",
        helper_text_bn: "আপনার অর্ডার নিশ্চিত করা হয়েছে।",
      },
      timeline: [
        {
          stage: "new",
          label: "Order placed",
          helper_text_bn: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।",
          created_at: "2026-08-30T06:00:00.000Z",
          customer_note: null,
        },
        {
          stage: "confirmed",
          label: "Confirmed",
          helper_text_bn: "আপনার অর্ডার নিশ্চিত করা হয়েছে।",
          created_at: "2026-08-30T08:00:00.000Z",
          customer_note: "Your order is confirmed and being prepared.",
        },
      ],
      expected_delivery_date: "2026-09-03",
      courier: { name: "Pathao", tracking_code: "TRACK-123" },
      items: [{
        name: "Oxford Shirt",
        image_url: "https://res.cloudinary.com/minan/image/upload/shirt.webp",
        size: "M",
        color: "Black",
        quantity: 2,
      }],
      shipping: { city: "Sylhet", area: "Inside Sylhet" },
      payment_method_label: "Cash on Delivery (COD)",
      totals: {
        currency: "BDT",
        merchandise_subtotal: 2400,
        order_discount: 100,
        merchandise_total: 2300,
        delivery_fee: 60,
        overall_order_value: 2360,
      },
    });

    const serializedText = JSON.stringify(serializeCustomerOrder(order));
    for (const secret of [
      "private@example.com",
      "01700000000",
      "private street",
      "Private checkout note",
      "private-provider-id",
      "admin@minan.com",
      "Internal confirmation reason",
      "A customer cannot publish a tracking note",
      "Never show this internal note",
      "private-refund-reference",
      "financial_review_required",
      customerId.toString(),
    ]) {
      expect(serializedText).not.toContain(secret);
    }
  });
});
