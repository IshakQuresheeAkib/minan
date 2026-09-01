import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import {
  Order,
  type DeliveryFeeStatus,
  type OrderActivity,
  type OrderStatus,
} from "../models/Order.js";
import { serializeCustomerOrder } from "./serializeCustomerOrder.js";

type TrackingOrderOptions = {
  activity?: OrderActivity[];
  deliveryFeeStatus?: DeliveryFeeStatus;
  financialReviewRequired?: boolean;
  paymentMethod?: "bkash_full" | "cod";
  settledPaymentAttemptId?: Types.ObjectId;
  status?: OrderStatus;
};

function makeTrackingOrder({
  activity = [],
  deliveryFeeStatus = "awaiting",
  financialReviewRequired = false,
  paymentMethod = "cod",
  settledPaymentAttemptId,
  status = "new",
}: TrackingOrderOptions = {}) {
  const createdAt = new Date("2026-08-30T06:00:00.000Z");
  return new Order({
    order_number: "MN-20260830-0002",
    customer_id: new Types.ObjectId(),
    name: "Tracking Customer",
    phone_number: "01700000000",
    normalized_phone: "01700000000",
    email: "tracking@example.com",
    normalized_email: "tracking@example.com",
    address: "Sylhet",
    lines: [{
      line_id: "line-1",
      product_id: new Types.ObjectId().toString(),
      name: "Oxford Shirt",
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
    item_signature: "tracking-signature",
    checkout_source: "cart",
    shipping_zone: "inside_sylhet",
    payment_method: paymentMethod,
    settled_payment_attempt_id: settledPaymentAttemptId,
    status,
    financials: {
      merchandise_subtotal: 1200,
      order_discount: 0,
      merchandise_total: 1200,
      delivery_fee: 60,
      overall_order_value: 1260,
      merchandise_paid_online: settledPaymentAttemptId ? 1200 : 0,
      exchange_credit_applied: 0,
      cod_due: settledPaymentAttemptId ? 0 : 1200,
      cod_collected: 0,
      merchandise_refunded: 0,
      exchange_credit_issued: 0,
    },
    delivery_fee_status: deliveryFeeStatus,
    cod_status: settledPaymentAttemptId ? "not_required" : "due",
    revision: 1,
    guest_access_version: 1,
    activity,
    refunds: [],
    financial_review_required: financialReviewRequired,
    createdAt,
    updatedAt: createdAt,
  });
}

describe("serializeCustomerOrder", () => {
  it.each([
    "new",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "on_hold",
    "cancelled",
    "returned",
    "exchanged",
  ] satisfies OrderStatus[])("maps the status_%s activity event to its customer stage", (status) => {
    const order = makeTrackingOrder({
      status,
      activity: [{
        actor_type: "admin",
        event: `status_${status}`,
        created_at: new Date("2026-08-31T06:00:00.000Z"),
      }],
    });

    expect(serializeCustomerOrder(order).timeline[0]?.stage).toBe(status);
  });

  it.each([
    { shippingZone: "outside_sylhet" as const, area: "Outside Sylhet" },
    { shippingZone: undefined, area: "Legacy / unspecified" },
  ])("does not invent a city for $area shipping", ({ shippingZone, area }) => {
    const order = makeTrackingOrder();
    order.shipping_zone = shippingZone;

    expect(serializeCustomerOrder(order).shipping).toEqual({
      city: null,
      area,
    });
  });

  it.each([
    { state: "awaiting", deliveryFeeStatus: "awaiting" as const },
    { state: "failed", deliveryFeeStatus: "failed" as const },
    { state: "verification pending", deliveryFeeStatus: "verification_pending" as const },
    {
      state: "financial review",
      deliveryFeeStatus: "verification_pending" as const,
      financialReviewRequired: true,
    },
    {
      state: "settled",
      deliveryFeeStatus: "paid" as const,
      settledPaymentAttemptId: new Types.ObjectId(),
    },
  ])("uses a neutral bKash method label when payment is $state", (state) => {
    const order = makeTrackingOrder({
      paymentMethod: "bkash_full",
      deliveryFeeStatus: state.deliveryFeeStatus,
      financialReviewRequired: state.financialReviewRequired,
      settledPaymentAttemptId: state.settledPaymentAttemptId,
    });

    expect(serializeCustomerOrder(order).payment_method_label).toBe("bKash full payment");
  });

  it("does not promote a partial merchandise return audit event to a customer stage", () => {
    const order = makeTrackingOrder({
      status: "delivered",
      activity: [{
        actor_type: "admin",
        event: "merchandise_returned",
        created_at: new Date("2026-08-31T06:00:00.000Z"),
      }],
    });

    expect(serializeCustomerOrder(order).timeline).toEqual([]);
  });

  it("uses only status_returned as the full-return customer stage", () => {
    const returnTime = new Date("2026-08-31T06:00:00.000Z");
    const order = makeTrackingOrder({
      status: "returned",
      activity: [
        { actor_type: "admin", event: "merchandise_returned", created_at: returnTime },
        { actor_type: "admin", event: "status_returned", created_at: returnTime },
      ],
    });

    expect(serializeCustomerOrder(order).timeline).toEqual([{
      stage: "returned",
      label: "Returned",
      helper_text_bn: "আপনার অর্ডারের রিটার্ন আপডেট করা হয়েছে।",
      created_at: "2026-08-31T06:00:00.000Z",
      customer_note: null,
    }]);
  });

  it("exposes an admin public tracking note but never its internal reason", () => {
    const order = makeTrackingOrder({
      status: "shipped",
      activity: [{
        actor_type: "admin",
        admin_id: new Types.ObjectId().toString(),
        admin_email: "admin@example.com",
        event: "tracking_updated",
        reason: "Internal courier escalation reference 8472",
        customer_note: "Your parcel is with the courier.",
        created_at: new Date("2026-09-01T06:00:00.000Z"),
      }],
    });

    const result = serializeCustomerOrder(order);

    expect(result.timeline).toEqual([expect.objectContaining({
      stage: "shipped",
      customer_note: "Your parcel is with the courier.",
    })]);
    expect(JSON.stringify(result)).not.toContain("Internal courier escalation");
    expect(JSON.stringify(result)).not.toContain("admin@example.com");
  });

  it("keeps a public tracking note at the stage where staff published it", () => {
    const order = makeTrackingOrder({
      status: "shipped",
      activity: [{
        actor_type: "admin",
        event: "tracking_updated",
        customer_note: "We expect to dispatch tomorrow.",
        metadata: { tracking_stage: "confirmed" },
        created_at: new Date("2026-09-01T06:00:00.000Z"),
      }],
    });

    expect(serializeCustomerOrder(order).timeline[0]?.stage).toBe("confirmed");
  });

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
