import { describe, expect, it } from "vitest";

import {
  buildTrackingJourney,
  formatTrackingDate,
  getOrderTrackingLoginHref,
} from "./trackingPresentation";
import type { CustomerOrderTracking } from "./types";

const order: CustomerOrderTracking = {
  courier: { name: "Pathao", tracking_code: "PX-42" },
  created_at: "2026-08-31T06:00:00.000Z",
  current_stage: {
    code: "shipped",
    helper_text_bn: "আপনার অর্ডার কুরিয়ারের কাছে দেওয়া হয়েছে।",
    label: "Shipped",
  },
  expected_delivery_date: "2026-09-03",
  items: [],
  order_id: "MN-20260831-0001",
  payment_method_label: "Cash on Delivery (COD)",
  shipping: { area: "Inside Sylhet", city: "Sylhet" },
  timeline: [
    {
      created_at: "2026-08-31T06:00:00.000Z",
      customer_note: null,
      helper_text_bn: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।",
      label: "Order placed",
      stage: "new",
    },
    {
      created_at: "2026-09-01T06:00:00.000Z",
      customer_note: "Courier pickup is complete.",
      helper_text_bn: "আপনার অর্ডার কুরিয়ারের কাছে দেওয়া হয়েছে।",
      label: "Shipped",
      stage: "shipped",
    },
  ],
  totals: {
    currency: "BDT",
    delivery_fee: 120,
    merchandise_subtotal: 1000,
    merchandise_total: 1000,
    order_discount: 0,
    overall_order_value: 1120,
  },
};

describe("tracking presentation", () => {
  it("builds a full fulfillment journey from the customer-safe tracking DTO", () => {
    expect(buildTrackingJourney(order)).toEqual([
      expect.objectContaining({ state: "complete", stage: "new" }),
      expect.objectContaining({ state: "complete", stage: "confirmed" }),
      expect.objectContaining({ state: "complete", stage: "processing" }),
      expect.objectContaining({
        customerNote: "Courier pickup is complete.",
        state: "current",
        stage: "shipped",
      }),
      expect.objectContaining({ state: "upcoming", stage: "delivered" }),
    ]);
  });

  it("formats date-only estimates without shifting the calendar day", () => {
    expect(formatTrackingDate("2026-09-03")).toBe("3 Sep 2026");
  });

  it("returns an account-safe sign-in recovery link without downgrading access to guest proof", () => {
    expect(getOrderTrackingLoginHref("account", "MN-20260831-0001")).toBe(
      "/account/login?next=%2Forders%3Forder%3DMN-20260831-0001%26access%3Daccount",
    );
  });
});
