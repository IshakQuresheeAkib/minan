import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationOutbox } from "../models/NotificationOutbox.js";
import {
  enqueueCustomerOrderNotification,
  processNextNotification,
} from "./notificationOutbox.service.js";

const safeOrder = {
  _id: new Types.ObjectId(),
  order_number: "MN-20260901-0001",
  email: "customer@example.com",
  status: "shipped",
  revision: 7,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  activity: [],
  expected_delivery_date: undefined,
  courier_name: "Pathao",
  tracking_number: "TRACK-123",
  lines: [],
  shipping_zone: "inside_sylhet",
  payment_method: "cod",
  financials: { merchandise_subtotal: 0, order_discount: 0, merchandise_total: 0, delivery_fee: 0, overall_order_value: 0 },
  phone_number: "01700000000",
  normalized_email: "customer@example.com",
  address: "Private address",
} as never;

describe("NotificationOutbox", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplicates a customer-safe shipment notification without delivering email inline", async () => {
    const update = vi.spyOn(NotificationOutbox, "updateOne").mockResolvedValue({ upsertedCount: 1 } as never);

    await enqueueCustomerOrderNotification(safeOrder, "status_shipped");

    expect(update).toHaveBeenCalledWith(
      { dedupe_key: `${safeOrder._id}:status_shipped:7` },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          event_type: "status_shipped",
          recipient_email: "customer@example.com",
        }),
      }),
      { upsert: true },
    );
    const payload = update.mock.calls[0]?.[1].$setOnInsert.payload as Record<string, unknown>;
    expect(JSON.stringify(payload)).not.toContain("Private address");
    expect(JSON.stringify(payload)).not.toContain("01700000000");
  });

  it("marks a claimed notification as sent through an injected email adapter", async () => {
    const id = new Types.ObjectId();
    vi.spyOn(NotificationOutbox, "findOneAndUpdate").mockResolvedValue({
      _id: id,
      recipient_email: "customer@example.com",
      event_type: "status_shipped",
      payload: { order: { order_id: "MN-20260901-0001", current_stage: { label: "Shipped" }, timeline: [], expected_delivery_date: null } },
      attempt_count: 1,
    } as never);
    const update = vi.spyOn(NotificationOutbox, "updateOne").mockResolvedValue({ modifiedCount: 1 } as never);
    const email = { send: vi.fn().mockResolvedValue({ id: "email_123" }) };

    expect(await processNextNotification(email)).toEqual({ processed: true, outcome: "sent" });
    expect(email.send).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(
      { _id: id, status: "processing" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "sent", provider_message_id: "email_123" }) }),
    );
  });

  it("schedules safe retries and ends at a durable failure state", async () => {
    const id = new Types.ObjectId();
    const email = { send: vi.fn().mockRejectedValue(new Error("provider unavailable")) };
    const update = vi.spyOn(NotificationOutbox, "updateOne").mockResolvedValue({ modifiedCount: 1 } as never);
    vi.spyOn(NotificationOutbox, "findOneAndUpdate")
      .mockResolvedValueOnce({ _id: id, recipient_email: "customer@example.com", event_type: "status_confirmed", payload: { order: {} }, attempt_count: 1 } as never)
      .mockResolvedValueOnce({ _id: id, recipient_email: "customer@example.com", event_type: "status_confirmed", payload: { order: {} }, attempt_count: 3 } as never);

    expect(await processNextNotification(email)).toEqual({ processed: true, outcome: "retry_scheduled" });
    expect(await processNextNotification(email)).toEqual({ processed: true, outcome: "failed" });
    expect(update.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ $set: expect.objectContaining({ status: "pending" }) }));
    expect(update.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ $set: expect.objectContaining({ status: "failed" }) }));
  });
});
