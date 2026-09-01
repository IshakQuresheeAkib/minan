import { randomUUID } from "node:crypto";

import type { ClientSession } from "mongoose";

import {
  NotificationOutbox,
  type NotificationEventType,
  type NotificationOutboxDocument,
} from "../models/NotificationOutbox.js";
import { serializeCustomerOrder } from "../utils/serializeCustomerOrder.js";
import type { OrderDocument } from "../models/Order.js";
import type { TransactionalEmailAdapter } from "./transactionalEmail.service.js";

const MAX_DELIVERY_ATTEMPTS = 3;
const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const MAX_NOTIFICATIONS_PER_RUN = 100;

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]!);
}

function subjectFor(eventType: NotificationEventType, orderId: string): string {
  const labels: Record<NotificationEventType, string> = {
    order_created: "Order received",
    status_confirmed: "Order confirmed",
    status_shipped: "Order shipped",
    status_delivered: "Order delivered",
    status_cancelled: "Order cancelled",
  };
  return `MINAN: ${labels[eventType]} (${orderId})`;
}

function emailContent(notification: NotificationOutboxDocument): { subject: string; html: string; text: string } {
  const { order } = notification.payload;
  const note = order.timeline.at(-1)?.customer_note;
  const deliveryEstimate = order.expected_delivery_date
    ? ` Expected delivery date: ${order.expected_delivery_date}.`
    : "";
  const noteText = note ? ` ${note}` : "";
  const text = `${order.current_stage.label}: order ${order.order_id}.${deliveryEstimate}${noteText}`;
  return {
    subject: subjectFor(notification.event_type, order.order_id),
    text,
    html: `<p>${escapeHtml(text)}</p>`,
  };
}

export async function enqueueCustomerOrderNotification(
  order: OrderDocument,
  eventType: NotificationEventType,
  session?: ClientSession,
): Promise<void> {
  const now = new Date();
  const dedupeKey = `${order._id}:${eventType}:${order.revision}`;
  await NotificationOutbox.updateOne(
    { dedupe_key: dedupeKey },
    {
      $setOnInsert: {
        order_id: order._id,
        recipient_email: order.email,
        event_type: eventType,
        dedupe_key: dedupeKey,
        payload: { order: serializeCustomerOrder(order) },
        status: "pending",
        attempt_count: 0,
        available_at: now,
      },
    },
    session ? { upsert: true, session } : { upsert: true },
  );
}

function retryAt(now: Date, attemptCount: number): Date {
  return new Date(now.getTime() + attemptCount * 60 * 1000);
}

export async function processNextNotification(
  email: TransactionalEmailAdapter,
  now = new Date(),
): Promise<{ processed: boolean; outcome?: "sent" | "retry_scheduled" | "failed" }> {
  const leaseToken = randomUUID();
  const notification = await NotificationOutbox.findOneAndUpdate(
    {
      $or: [
        { status: "pending", available_at: { $lte: now } },
        { status: "processing", locked_at: { $lte: new Date(now.getTime() - PROCESSING_LEASE_MS) } },
      ],
    },
    {
      $set: { status: "processing", locked_at: now, lease_token: leaseToken },
      $inc: { attempt_count: 1 },
    },
    { new: true, sort: { available_at: 1, _id: 1 } },
  );
  if (!notification) return { processed: false };

  try {
    const delivery = await email.send({
      to: notification.recipient_email,
      ...emailContent(notification),
      idempotency_key: notification.dedupe_key,
    });
    await NotificationOutbox.updateOne(
      { _id: notification._id, status: "processing", lease_token: notification.lease_token },
      { $set: { status: "sent", sent_at: now, provider_message_id: delivery.id }, $unset: { locked_at: 1, lease_token: 1, last_error: 1 } },
    );
    return { processed: true, outcome: "sent" };
  } catch {
    const exhausted = notification.attempt_count >= MAX_DELIVERY_ATTEMPTS;
    await NotificationOutbox.updateOne(
      { _id: notification._id, status: "processing", lease_token: notification.lease_token },
      {
        $set: exhausted
          ? { status: "failed", last_error: "Email delivery failed" }
          : { status: "pending", available_at: retryAt(now, notification.attempt_count), last_error: "Email delivery failed" },
        $unset: { locked_at: 1, lease_token: 1 },
      },
    );
    return { processed: true, outcome: exhausted ? "failed" : "retry_scheduled" };
  }
}

export async function processPendingNotifications(
  email: TransactionalEmailAdapter,
): Promise<{ processed: number }> {
  let processed = 0;
  while (processed < MAX_NOTIFICATIONS_PER_RUN) {
    const result = await processNextNotification(email);
    if (!result.processed) break;
    processed += 1;
  }
  return { processed };
}

type NotificationProcessor = () => Promise<unknown>;

export function startNotificationOutboxProcessor(
  processNotifications: NotificationProcessor,
  schedule: typeof setInterval = setInterval,
  cancel: typeof clearInterval = clearInterval,
  intervalMs = 60_000,
): () => Promise<void> {
  let stopped = false;
  let activeRun: Promise<void> | undefined;
  const run = (): void => {
    if (stopped || activeRun) return;
    activeRun = (async () => {
      try {
        await processNotifications();
      } catch (error) {
        console.error("Notification outbox processing failed", error);
      } finally {
        activeRun = undefined;
      }
    })();
  };

  run();
  const timer = schedule(() => {
    run();
  }, intervalMs);
  return async () => {
    stopped = true;
    cancel(timer);
    await activeRun;
  };
}
