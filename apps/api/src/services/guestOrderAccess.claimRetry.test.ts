import { afterEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import { Order } from "../models/Order.js";
import { claimGuestOrder } from "./guestOrderAccess.service.js";

const now = new Date("2026-08-31T10:00:00.000Z");
const orderId = new Types.ObjectId("66f000000000000000000001");
const customerId = new Types.ObjectId("66f000000000000000000003");
const orderNumber = "MN-20260831-0001";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("claimGuestOrder", () => {
  it("returns the full tracking response when a same-customer concurrent claim retries", async () => {
    const fullClaimedOrder = Order.hydrate({
      _id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      normalized_email: "guest@example.com",
      status: "new",
      createdAt: now,
      activity: [],
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
      shipping_zone: "inside_sylhet",
      payment_method: "cod",
      financials: {
        merchandise_subtotal: 1200,
        order_discount: 0,
        merchandise_total: 1200,
        delivery_fee: 60,
        overall_order_value: 1260,
      },
    });
    const projectedOrder = Order.hydrate({
      _id: orderId,
      customer_id: customerId,
    });
    const query = {
      select: vi.fn().mockResolvedValue(projectedOrder),
      then: <T>(resolve: (value: typeof fullClaimedOrder) => T) => resolve(fullClaimedOrder),
    };

    vi.spyOn(Order, "findOneAndUpdate").mockResolvedValueOnce(null);
    vi.spyOn(Order, "findOne").mockReturnValueOnce(query as never);

    await expect(claimGuestOrder(orderNumber, customerId.toString(), {
      order_id: orderId.toString(),
      order_number: orderNumber,
      normalized_email: "guest@example.com",
      guest_access_version: 1,
      challenge_id: "66f000000000000000000002",
    }, now)).resolves.toMatchObject({
      claim_status: "already_claimed",
      order: {
        order_id: orderNumber,
        created_at: now.toISOString(),
      },
    });
  });
});
