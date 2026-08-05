import "../config/env.js";

import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { Types } from "mongoose";

import { connectDB, disconnectDB } from "../config/db.js";
import { Lead } from "../models/Lead.js";
import { Order, type OrderLine, type OrderStatus } from "../models/Order.js";
import { OrderCounter } from "../models/OrderCounter.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { buildItemSignature, calculateFinancials, normalizeBangladeshPhone } from "../services/orders.service.js";

const apply = process.argv.includes("--apply");
const BANGLADESH_OFFSET_MS = 6 * 60 * 60 * 1000;

type SequenceReservation = {
  next: number;
  end: number;
};

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export function dateKey(date: Date): string {
  const local = new Date(date.getTime() + BANGLADESH_OFFSET_MS);
  return `${local.getUTCFullYear()}${String(local.getUTCMonth() + 1).padStart(2, "0")}${String(local.getUTCDate()).padStart(2, "0")}`;
}

export function createSequenceReservation(endSequence: number, count: number): SequenceReservation {
  if (!Number.isSafeInteger(endSequence) || !Number.isSafeInteger(count) || count < 1) {
    throw new Error("Invalid order-number reservation");
  }
  const start = endSequence - count + 1;
  if (start < 1) throw new Error("Invalid order-number reservation range");
  return { next: start, end: endSequence };
}

export function takeReservedOrderNumber(key: string, reservation: SequenceReservation): string {
  if (reservation.next > reservation.end) {
    throw new Error(`Order-number reservation exhausted for ${key}`);
  }
  const sequence = reservation.next;
  reservation.next += 1;
  return `MN-${key}-${String(sequence).padStart(4, "0")}`;
}

function parseOrderSequence(orderNumber: string, key: string): number | null {
  const match = new RegExp(`^MN-${key}-(\\d{4,})$`).exec(orderNumber);
  if (!match?.[1]) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) && sequence > 0 ? sequence : null;
}

async function maxExistingSequencesByDay(keys: Iterable<string>): Promise<Map<string, number>> {
  const uniqueKeys = [...new Set(keys)];
  const maxByDay = new Map(uniqueKeys.map((key) => [key, 0]));
  if (uniqueKeys.length === 0) return maxByDay;
  const orders = await Order.find({
    $or: uniqueKeys.map((key) => ({ order_number: new RegExp(`^MN-${key}-\\d{4,}$`) })),
  }).select("order_number");
  for (const order of orders) {
    for (const key of uniqueKeys) {
      const sequence = parseOrderSequence(order.order_number, key);
      if (sequence !== null && sequence > (maxByDay.get(key) ?? 0)) {
        maxByDay.set(key, sequence);
      }
    }
  }
  return maxByDay;
}

async function reserveOrderNumberRanges(countsByDay: Map<string, number>): Promise<Map<string, SequenceReservation>> {
  const minimumSequences = await maxExistingSequencesByDay(countsByDay.keys());
  const reservations = new Map<string, SequenceReservation>();
  for (const [key, count] of countsByDay) {
    if (count < 1) continue;
    const minimumSequence = minimumSequences.get(key) ?? 0;
    const reserve = async () => OrderCounter.findOneAndUpdate(
      { _id: key },
      [
        {
          $set: {
            sequence: { $add: [{ $max: [{ $ifNull: ["$sequence", 0] }, minimumSequence] }, count] },
            createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
            updatedAt: "$$NOW",
          },
        },
      ],
      { upsert: true, new: true },
    );
    let counter;
    try {
      counter = await reserve();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      counter = await reserve();
    }
    if (!counter) throw new Error(`Could not reserve order numbers for ${key}`);
    reservations.set(key, createSequenceReservation(counter.sequence, count));
  }
  return reservations;
}

function status(value: string): { status: OrderStatus; review: boolean } {
  if (value === "processing") return { status: "processing", review: false };
  if (value === "shipped") return { status: "shipped", review: false };
  if (value === "delivered") return { status: "delivered", review: false };
  if (value === "cancelled") return { status: "cancelled", review: false };
  if (value === "delivery_failed") return { status: "returned", review: true };
  return { status: "new", review: false };
}

async function report() {
  const [leadCount, orderCount, attempts, missingSnapshots, statuses, attemptStatuses, merchandiseTotals, orphanAttemptRows, duplicateTransactions] = await Promise.all([
    Lead.countDocuments(),
    Order.countDocuments(),
    PaymentAttempt.countDocuments({ lead_id: { $exists: true } }),
    Lead.countDocuments({ $or: [{ cart_snapshot: { $exists: false } }, { "cart_snapshot.items.0": { $exists: false } }] }),
    Lead.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$delivery_status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    PaymentAttempt.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Lead.aggregate<{ _id: null; total: number }>([{ $group: { _id: null, total: { $sum: "$cart_snapshot.total" } } }]),
    PaymentAttempt.aggregate<{ _id: Types.ObjectId }>([
      { $match: { lead_id: { $exists: true } } },
      { $lookup: { from: "leads", localField: "lead_id", foreignField: "_id", as: "lead" } },
      { $match: { "lead.0": { $exists: false } } },
      { $project: { _id: 1 } },
    ]),
    PaymentAttempt.aggregate<{ _id: string; count: number }>([
      { $match: { bkash_trx_id: { $exists: true } } },
      { $group: { _id: "$bkash_trx_id", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]),
  ]);
  return {
    leadCount, orderCount, attempts, missingSnapshots, statuses, attemptStatuses,
    merchandiseTotal: merchandiseTotals[0]?.total ?? 0,
    orphanAttempts: orphanAttemptRows.length,
    duplicateTransactions: duplicateTransactions.length,
  };
}

async function migrate(): Promise<void> {
  await connectDB();
  const before = await report();
  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${JSON.stringify(before, null, 2)}`);
  if (!apply) {
    console.log("No records changed. Resolve every anomaly, take a backup, enable checkout maintenance, then re-run with --apply.");
    return;
  }
  if (before.missingSnapshots > 0 || before.duplicateTransactions > 0) {
    throw new Error("Migration refused because dry-run anomalies remain");
  }

  const leads = await Lead.find().select("+checkout_idempotency_hash").sort({ createdAt: 1, _id: 1 });
  const existingOrders = await Order.find({ _id: { $in: leads.map((lead) => lead._id) } }).select("_id");
  const existingOrderIds = new Set(existingOrders.map((order) => String(order._id)));
  const leadsToCreate = leads.filter((lead) => !existingOrderIds.has(String(lead._id)));
  const countsByDay = new Map<string, number>();
  for (const lead of leadsToCreate) {
    const key = dateKey(lead.createdAt);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }
  const reservationsByDay = await reserveOrderNumberRanges(countsByDay);
  let created = 0;
  for (const lead of leadsToCreate) {
    const key = dateKey(lead.createdAt);
    const reservation = reservationsByDay.get(key);
    if (!reservation) throw new Error(`Missing order-number reservation for ${key}`);
    const lines: OrderLine[] = lead.cart_snapshot.items.map((item) => ({
      line_id: randomUUID(), product_id: item.product_id, name: item.name, unit_price: item.price,
      original_price: item.original_price ?? item.price, product_discount: item.discount ?? 0,
      size: item.size, color: item.color, quantity: item.quantity, allocated_order_discount: 0,
      returned_quantity: 0, credited_amount: 0,
    }));
    const completed = await PaymentAttempt.findOne({ lead_id: lead._id, status: "completed" }).sort({ sequence: -1 });
    const parsedPaid = completed ? Number(completed.expected_amount) : 0;
    const paid = Number.isSafeInteger(parsedPaid) ? Math.min(parsedPaid, lead.cart_snapshot.total) : 0;
    const mapped = status(lead.delivery_status);
    const financials = calculateFinancials({ lines, deliveryFee: 0, merchandisePaidOnline: paid });
    await Order.collection.insertOne({
      _id: lead._id,
      order_number: takeReservedOrderNumber(key, reservation),
      name: lead.name,
      phone_number: lead.phone_number,
      normalized_phone: normalizeBangladeshPhone(lead.phone_number),
      email: lead.email,
      address: lead.address,
      customer_notes: lead.notes,
      lines,
      item_signature: buildItemSignature(lines),
      checkout_source: lead.checkout_source,
      checkout_idempotency_hash: lead.checkout_idempotency_hash,
      status: mapped.status,
      financials,
      delivery_fee_status: "not_required",
      cod_status: financials.cod_due > 0 ? "due" : "not_required",
      duplicate_order_ids: [],
      duplicate_review_state: "none",
      revision: 1,
      activity: [{ actor_type: "migration", event: "lead_migrated", reason: mapped.review ? "Legacy delivery_failed requires review" : undefined, created_at: new Date() }],
      refunds: [],
      financial_review_required: mapped.review || (completed !== null && !Number.isSafeInteger(parsedPaid)),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    });
    created += 1;
  }

  const migratedOrders = await Order.find({ _id: { $in: leads.map((lead) => lead._id) } })
    .sort({ createdAt: 1, _id: 1 })
    .select("normalized_phone item_signature createdAt");
  const recentBySignature = new Map<string, typeof migratedOrders>();
  for (const order of migratedOrders) {
    const duplicateKey = `${order.normalized_phone}:${order.item_signature}`;
    const recent = (recentBySignature.get(duplicateKey) ?? []).filter(
      (candidate) => order.createdAt.getTime() - candidate.createdAt.getTime() <= 24 * 60 * 60 * 1000,
    );
    if (recent.length > 0) {
      const ids = recent.map((candidate) => candidate._id);
      await Promise.all([
        Order.updateOne({ _id: order._id }, { $addToSet: { duplicate_order_ids: { $each: ids } }, $set: { duplicate_review_state: "pending" } }),
        Order.updateMany({ _id: { $in: ids } }, { $addToSet: { duplicate_order_ids: order._id }, $set: { duplicate_review_state: "pending" } }),
      ]);
    }
    recent.push(order);
    recentBySignature.set(duplicateKey, recent);
  }
  const attempts = await PaymentAttempt.updateMany(
    { lead_id: { $exists: true } },
    [{ $set: { order_id: "$lead_id", payment_purpose: "legacy_full_order" } }],
  );
  const after = await report();
  console.log(`Migration complete: ${created} Orders created; ${attempts.modifiedCount} attempts linked.`);
  console.log(`Verification: ${JSON.stringify(after, null, 2)}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  migrate()
    .then(async () => { await disconnectDB(); process.exit(0); })
    .catch(async (error: unknown) => { console.error("Lead-to-Order migration failed:", error); await disconnectDB(); process.exit(1); });
}
