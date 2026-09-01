import { randomUUID } from "node:crypto";

import mongoose, { type ClientSession, type QueryFilter, UpdateQuery, Types } from "mongoose";

import { shippingAreaLabel } from "../config/shipping.js";
import { AppError } from "../lib/errors.js";
import { normalizeEmail } from "../lib/normalizeEmail.js";
import {
  Order,
  type OrderDocument,
  type OrderLine,
  type OrderStatus,
} from "../models/Order.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import type {
  OrderCodInput,
  OrderCourierUpdateInput,
  OrderCustomerUpdateInput,
  OrderDuplicateReviewInput,
  OrderExchangeInput,
  OrderItemsUpdateInput,
  OrderListQuery,
  OrderNoteInput,
  OrderRefundInput,
  OrderReturnInput,
  OrderTrackingUpdateInput,
  OrderTransitionInput,
} from "../schemas/order.schemas.js";
import type { AuthenticatedAdmin } from "../types/auth.types.js";
import { serializeOrder } from "../utils/serializeOrder.js";
import { buildVerifiedCartSnapshot } from "./checkoutCart.service.js";
import { enqueueCustomerOrderNotification } from "./notificationOutbox.service.js";
import {
  allocateOrderDiscount,
  allocateOrderNumber,
  buildItemSignature,
  calculateFinancials,
  normalizeBangladeshPhone,
} from "./orders.service.js";

const BANGLADESH_OFFSET_MS = 6 * 60 * 60 * 1000;
const PRE_SHIPMENT = new Set<OrderStatus>(["new", "confirmed", "processing", "on_hold"]);
const TERMINAL = new Set<OrderStatus>(["cancelled", "returned", "exchanged"]);
const NORMAL_SEQUENCE: OrderStatus[] = ["new", "confirmed", "processing", "shipped", "delivered"];

type PageOptions = { page: number; limit: number; skip: number };

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function parseSet<T extends string>(value: string | undefined, allowed: readonly T[]): T[] {
  if (!value) return [];
  const allowedSet = new Set<string>(allowed);
  return value.split(",").map((item) => item.trim()).filter((item): item is T => allowedSet.has(item));
}

function bdBoundary(value: string, end: boolean): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + (end ? 1 : 0)) - BANGLADESH_OFFSET_MS);
}

function buildFilter(query: OrderListQuery): QueryFilter<OrderDocument> {
  const filter: QueryFilter<OrderDocument> = {};
  const statuses = parseSet(query.status, ["new", "confirmed", "processing", "shipped", "delivered", "on_hold", "cancelled", "returned", "exchanged"] as const);
  const paymentStatuses = parseSet(query.payment_status, ["not_required", "awaiting", "processing", "paid", "failed", "verification_pending", "expired"] as const);
  const codStatuses = parseSet(query.cod_status, ["not_required", "due", "collected", "partially_refunded", "refunded"] as const);
  if (statuses.length) filter.status = { $in: statuses };
  if (paymentStatuses.length) filter.delivery_fee_status = { $in: paymentStatuses };
  if (codStatuses.length) filter.cod_status = { $in: codStatuses };
  if (query.duplicate_only === "true") filter.duplicate_review_state = "pending";
  if (query.date_from || query.date_to) {
    filter.createdAt = {};
    if (query.date_from) filter.createdAt.$gte = bdBoundary(query.date_from, false);
    if (query.date_to) filter.createdAt.$lt = bdBoundary(query.date_to, true);
  }
  if (query.search) {
    const search = new RegExp(escaped(query.search), "i");
    filter.$or = [
      { order_number: search }, { name: search }, { phone_number: search },
      { normalized_phone: search }, { email: search }, { tracking_number: search },
    ];
  }
  return filter;
}

function sortFor(value: OrderListQuery["sort"]): Record<string, 1 | -1> {
  if (value === "oldest") return { createdAt: 1, _id: 1 };
  if (value === "order_number") return { order_number: -1, _id: -1 };
  return { createdAt: -1, _id: -1 };
}

export async function listAdminOrders(query: OrderListQuery, page: PageOptions) {
  const filter = buildFilter(query);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sortFor(query.sort)).skip(page.skip).limit(page.limit),
    Order.countDocuments(filter),
  ]);
  return {
    data: orders.map((order) => serializeOrder(order, [], false)),
    total,
    page: page.page,
    limit: page.limit,
  };
}

export async function getAdminOrderById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid order id", 400);
  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  const attempts = await PaymentAttempt.find({ order_id: order._id }).sort({ sequence: -1 });
  return serializeOrder(order, attempts, true);
}

function cursorFor(order: OrderDocument): string {
  return Buffer.from(JSON.stringify({ createdAt: order.createdAt.toISOString(), id: order._id.toString() }))
    .toString("base64url");
}

export async function listOrderChanges(cursor?: string) {
  if (!cursor) {
    const latest = await Order.findOne().sort({ createdAt: -1, _id: -1 });
    return { data: [], cursor: latest ? cursorFor(latest) : null };
  }
  let after: { createdAt: Date; id: Types.ObjectId } | null = null;
  if (cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { createdAt: string; id: string };
      if (!Types.ObjectId.isValid(parsed.id)) throw new Error("invalid id");
      after = { createdAt: new Date(parsed.createdAt), id: new Types.ObjectId(parsed.id) };
      if (Number.isNaN(after.createdAt.getTime())) throw new Error("invalid date");
    } catch {
      throw new AppError("Invalid changes cursor", 400);
    }
  }
  const filter = after
    ? { $or: [{ createdAt: { $gt: after.createdAt } }, { createdAt: after.createdAt, _id: { $gt: after.id } }] }
    : {};
  const orders = await Order.find(filter).sort({ createdAt: 1, _id: 1 }).limit(100);
  return {
    data: orders.map((order) => serializeOrder(order, [], false)),
    cursor: orders.length ? cursorFor(orders[orders.length - 1]!) : cursor ?? null,
  };
}

export async function exportAdminOrdersCsv(query: OrderListQuery): Promise<string> {
  const orders = await Order.find(buildFilter(query)).sort(sortFor(query.sort)).limit(10_000);
  const orderIds = orders.map((order) => order._id);
  const attempts = await PaymentAttempt.find({ order_id: { $in: orderIds }, status: "completed" })
    .sort({ sequence: 1 });
  const settledAttemptIdByOrder = new Map(
    orders
      .filter((order) => order.settled_payment_attempt_id)
      .map((order) => [
        order._id.toString(),
        order.settled_payment_attempt_id!.toString(),
      ]),
  );
  const transactionByOrder = new Map<string, string>();
  const duplicateTransactionsByOrder = new Map<string, string[]>();
  for (const attempt of attempts) {
    if (!attempt.order_id || !attempt.bkash_trx_id) continue;
    const orderId = attempt.order_id.toString();
    const settledAttemptId = settledAttemptIdByOrder.get(orderId);
    if (settledAttemptId) {
      if (attempt._id.toString() === settledAttemptId) {
        transactionByOrder.set(orderId, attempt.bkash_trx_id);
      } else {
        const duplicates = duplicateTransactionsByOrder.get(orderId) ?? [];
        duplicates.push(attempt.bkash_trx_id);
        duplicateTransactionsByOrder.set(orderId, duplicates);
      }
      continue;
    }
    if (!transactionByOrder.has(orderId)) {
      transactionByOrder.set(orderId, attempt.bkash_trx_id);
    } else {
      const duplicates = duplicateTransactionsByOrder.get(orderId) ?? [];
      duplicates.push(attempt.bkash_trx_id);
      duplicateTransactionsByOrder.set(orderId, duplicates);
    }
  }
  const rows: unknown[][] = [[
    "Order number", "Created", "Workflow status", "Payment method", "Fee status", "COD status",
    "Customer", "Phone", "Email", "Address", "Shipping area", "Items", "Merchandise subtotal",
    "Order discount", "Merchandise total", "Merchandise paid online", "Delivery fee", "COD due", "COD collected",
    "Merchandise refunded", "bKash transaction", "Duplicate bKash transactions", "Courier", "Tracking number",
  ]];
  for (const order of orders) {
    rows.push([
      order.order_number, order.createdAt.toISOString(), order.status, order.payment_method ?? "",
      order.delivery_fee_status,
      order.cod_status, order.name, order.phone_number, order.email, order.address,
      shippingAreaLabel(order.shipping_zone),
      order.lines.map((line) => `${line.name} (${line.size}/${line.color}) x${line.quantity}`).join("; "),
      order.financials.merchandise_subtotal, order.financials.order_discount,
      order.financials.merchandise_total, order.financials.merchandise_paid_online,
      order.financials.delivery_fee,
      order.financials.cod_due, order.financials.cod_collected,
      order.financials.merchandise_refunded,
      transactionByOrder.get(order._id.toString()) ?? "",
      duplicateTransactionsByOrder.get(order._id.toString())?.join("; ") ?? "",
      order.courier_name ?? "",
      order.tracking_number ?? "",
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
}

function activity(
  admin: AuthenticatedAdmin,
  event: string,
  reason?: string,
  metadata?: Record<string, string | number | boolean | null>,
  customerNote?: string,
) {
  return {
    actor_type: "admin" as const,
    admin_id: admin.id,
    admin_email: admin.email,
    event,
    reason,
    metadata,
    ...(customerNote ? { customer_note: customerNote } : {}),
    created_at: new Date(),
  };
}

async function casUpdate(
  id: string,
  expectedRevision: number,
  update: UpdateQuery<OrderDocument>,
  guard: QueryFilter<OrderDocument> = {},
  session?: ClientSession,
): Promise<OrderDocument> {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid order id", 400);
  const next: UpdateQuery<OrderDocument> = { ...update, $inc: { ...(update.$inc ?? {}), revision: 1 } };
  const order = await Order.findOneAndUpdate(
    { _id: id, revision: expectedRevision, ...guard },
    next,
    { new: true, runValidators: true, ...(session ? { session } : {}) },
  );
  if (order) return order;
  const latest = await Order.findById(id).select("revision");
  if (!latest) throw new AppError("Order not found", 404);
  throw new AppError(`Order changed in another session. Latest revision is ${latest.revision}`, 409);
}

function ensureEditable(order: OrderDocument): void {
  if (!PRE_SHIPMENT.has(order.status)) throw new AppError("Order details lock after shipment", 409);
}

function codStatusForBalance(codDue: number, codCollected: number): "not_required" | "collected" | "due" {
  if (codDue === 0) return "not_required";
  return codCollected >= codDue ? "collected" : "due";
}

export async function updateOrderCustomer(id: string, input: OrderCustomerUpdateInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  ensureEditable(current);
  const fields: Record<string, string> = {};
  if (input.name !== undefined) fields.name = input.name;
  if (input.phone_number !== undefined) {
    fields.phone_number = input.phone_number;
    fields.normalized_phone = normalizeBangladeshPhone(input.phone_number);
  }
  if (input.email !== undefined) {
    fields.email = input.email;
    fields.normalized_email = normalizeEmail(input.email);
  }
  if (input.address !== undefined) fields.address = input.address;
  const order = await casUpdate(id, input.expected_revision, {
    $set: fields,
    $push: { activity: activity(admin, "customer_details_updated", input.reason) },
  });
  return serializeOrder(order, [], true);
}

export async function updateOrderItems(id: string, input: OrderItemsUpdateInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  ensureEditable(current);
  const fullPaymentAttemptExists = await PaymentAttempt.exists({
    order_id: current._id,
    payment_purpose: "order_total",
  });
  if (fullPaymentAttemptExists) {
    throw new AppError("Order items lock after a full-payment attempt starts", 409);
  }
  const verified = await buildVerifiedCartSnapshot({
    items: input.items.map((item) => ({ ...item, name: "", price: 0 })), total: 0,
  });
  const currentById = new Map(current.lines.map((line) => [line.line_id, line]));
  const lines = verified.items.map((item, index): OrderLine => {
    const requested = input.items[index]!;
    const previous = requested.line_id ? currentById.get(requested.line_id) : undefined;
    const preserve = previous && previous.product_id === item.product_id && previous.size === item.size && previous.color === item.color;
    return {
      line_id: preserve ? previous.line_id : randomUUID(),
      product_id: item.product_id,
      name: preserve ? previous.name : item.name,
      image_url: preserve ? previous.image_url : item.image_url,
      unit_price: preserve ? previous.unit_price : item.price,
      original_price: preserve ? previous.original_price : item.original_price ?? item.price,
      product_discount: preserve ? previous.product_discount : item.discount ?? 0,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      allocated_order_discount: 0,
      returned_quantity: preserve ? previous.returned_quantity : 0,
      credited_amount: preserve ? previous.credited_amount : 0,
    };
  });
  if (lines.some((line) => line.returned_quantity > line.quantity)) {
    throw new AppError("Returned quantities cannot be removed from an order", 409);
  }
  const allocated = allocateOrderDiscount(lines, input.order_discount);
  const financials = calculateFinancials({
    lines: allocated,
    orderDiscount: input.order_discount,
    deliveryFee: current.financials.delivery_fee,
    merchandisePaidOnline: current.financials.merchandise_paid_online,
    exchangeCreditApplied: current.financials.exchange_credit_applied,
    codCollected: current.financials.cod_collected,
    merchandiseRefunded: current.financials.merchandise_refunded,
    exchangeCreditIssued: current.financials.exchange_credit_issued,
  });
  if (financials.merchandise_paid_online + financials.exchange_credit_applied > financials.merchandise_total) {
    throw new AppError("The new merchandise total is below funds already applied", 409);
  }
  if (financials.cod_collected > financials.cod_due) {
    throw new AppError("The new merchandise total is below COD already collected", 409);
  }
  const codStatus = codStatusForBalance(financials.cod_due, financials.cod_collected);
  const order = await casUpdate(id, input.expected_revision, {
    $set: { lines: allocated, financials, item_signature: buildItemSignature(allocated), cod_status: codStatus },
    $push: { activity: activity(admin, "order_items_updated", input.reason, { customer_confirmed: true }) },
  }, { full_payment_locked_revision: { $exists: false } });
  return serializeOrder(order, [], true);
}

function validateTransition(order: OrderDocument, input: OrderTransitionInput): { held_from_status?: string | null } {
  if (TERMINAL.has(order.status)) throw new AppError("Terminal Orders cannot transition", 409);
  if (input.status === order.status) throw new AppError("Order is already in that status", 409);
  if (input.status === "confirmed" && !["paid", "not_required"].includes(order.delivery_fee_status)) {
    throw new AppError("Delivery fee must be paid before confirmation", 409);
  }
  if (input.status === "on_hold") {
    if (!["new", "confirmed", "processing"].includes(order.status)) throw new AppError("This Order cannot be held", 409);
    if (!input.reason) throw new AppError("A hold reason is required", 400);
    return { held_from_status: order.status };
  }
  if (order.status === "on_hold") {
    if (input.status !== order.held_from_status) throw new AppError("Resume must return to the held workflow status", 409);
    return { held_from_status: null };
  }
  if (input.status === "cancelled") {
    if (!PRE_SHIPMENT.has(order.status) || !input.reason) throw new AppError("Pre-shipment cancellation requires a reason", 409);
    return {};
  }
  if (input.status === "shipped" && (!order.courier_name || !order.tracking_number)) {
    throw new AppError("Courier and tracking number are required before shipping", 409);
  }
  const from = NORMAL_SEQUENCE.indexOf(order.status);
  const to = NORMAL_SEQUENCE.indexOf(input.status);
  if (from < 0 || to < 0 || to !== from + 1) {
    if (!input.override_reason || !PRE_SHIPMENT.has(order.status) || !PRE_SHIPMENT.has(input.status)) {
      throw new AppError("This transition requires a pre-shipment override reason", 409);
    }
  }
  return {};
}

export async function transitionOrder(
  id: string,
  input: OrderTransitionInput,
  admin: AuthenticatedAdmin,
  session?: ClientSession,
) {
  const current = session
    ? await Order.findById(id).session(session)
    : await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  const state = validateTransition(current, input);
  const set: Record<string, unknown> = { status: input.status };
  const unset: Record<string, 1> = {};
  if (state.held_from_status) set.held_from_status = state.held_from_status;
  if (state.held_from_status === null) unset.held_from_status = 1;
  if (input.status === "shipped") set.shipped_at = new Date();
  if (input.status === "delivered") set.delivered_at = new Date();
  const order = await casUpdate(id, input.expected_revision, {
    $set: set,
    ...(Object.keys(unset).length ? { $unset: unset } : {}),
    $push: { activity: activity(admin, `status_${input.status}`, input.reason ?? input.override_reason, { from: current.status }) },
  }, {}, session);
  return serializeOrder(order, [], true);
}

export async function updateOrderCourier(id: string, input: OrderCourierUpdateInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  if (["delivered", "cancelled", "returned", "exchanged"].includes(current.status)) throw new AppError("Courier details lock after delivery", 409);
  const order = await casUpdate(id, input.expected_revision, {
    $set: { courier_name: input.courier_name, tracking_number: input.tracking_number },
    $push: { activity: activity(admin, "courier_updated", input.reason) },
  });
  return serializeOrder(order, [], true);
}

export async function recordOrderCod(id: string, input: OrderCodInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  const outstanding = Math.max(current.financials.cod_due - current.financials.cod_collected, 0);
  const amount = input.amount ?? outstanding;
  if (amount <= 0 || amount > outstanding) throw new AppError("COD collection exceeds the outstanding amount", 400);
  const collected = current.financials.cod_collected + amount;
  const order = await casUpdate(
    id,
    input.expected_revision,
    {
      $set: { "financials.cod_collected": collected, cod_status: collected === current.financials.cod_due ? "collected" : "due" },
      $push: { activity: activity(admin, "cod_collected", input.reason, { amount }) },
    },
    { "financials.merchandise_paid_online": 0 },
  );
  return serializeOrder(order, [], true);
}

export async function appendOrderNote(id: string, input: OrderNoteInput, admin: AuthenticatedAdmin) {
  const order = await casUpdate(id, input.expected_revision, { $push: { activity: activity(admin, "note_added", input.note) } });
  return serializeOrder(order, [], true);
}

export async function updateOrderTracking(
  id: string,
  input: OrderTrackingUpdateInput,
  admin: AuthenticatedAdmin,
) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid order id", 400);
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  const expectedDeliveryDate = input.expected_delivery_date
    ? new Date(`${input.expected_delivery_date}T00:00:00.000Z`)
    : undefined;
  const order = await casUpdate(id, input.expected_revision, {
    ...(expectedDeliveryDate ? { $set: { expected_delivery_date: expectedDeliveryDate } } : {}),
    $push: {
      activity: activity(
        admin,
        "tracking_updated",
        undefined,
        { tracking_stage: current.status },
        input.public_note,
      ),
    },
  });
  return serializeOrder(order, [], true);
}

const customerNotificationEvents = {
  confirmed: "status_confirmed",
  shipped: "status_shipped",
  delivered: "status_delivered",
  cancelled: "status_cancelled",
} as const;

export async function transitionOrderAndQueueNotification(
  id: string,
  input: OrderTransitionInput,
  admin: AuthenticatedAdmin,
) {
  const session = await mongoose.startSession();
  try {
    let result: ReturnType<typeof serializeOrder> | undefined;
    await session.withTransaction(async () => {
      result = await transitionOrder(id, input, admin, session);
      const eventType = customerNotificationEvents[input.status as keyof typeof customerNotificationEvents];
      if (!eventType) return;
      const order = await Order.findById(id).session(session);
      if (!order) throw new AppError("Order not found", 404);
      await enqueueCustomerOrderNotification(order, eventType, session);
    });
    if (!result) throw new AppError("Order transition did not complete", 500);
    return result;
  } finally {
    await session.endSession();
  }
}

export async function reviewOrderDuplicate(id: string, input: OrderDuplicateReviewInput, admin: AuthenticatedAdmin) {
  const order = await casUpdate(id, input.expected_revision, {
    $set: { duplicate_review_state: input.state },
    $push: { activity: activity(admin, `duplicate_${input.state}`, input.reason) },
  });
  return serializeOrder(order, [], true);
}

function applyReturnedLines(order: OrderDocument, requested: readonly { line_id: string; quantity: number }[]): { lines: OrderLine[]; credit: number } {
  const quantities = new Map(requested.map((item) => [item.line_id, item.quantity]));
  let credit = 0;
  const lines = order.lines.map((line) => {
    const quantity = quantities.get(line.line_id);
    if (!quantity) return { ...line };
    if (line.returned_quantity + quantity > line.quantity) throw new AppError(`Return quantity exceeds ${line.name}`, 400);
    const lineNet = line.unit_price * line.quantity - line.allocated_order_discount;
    const nextReturned = line.returned_quantity + quantity;
    const nextCredited = nextReturned === line.quantity
      ? lineNet
      : Math.floor((lineNet * nextReturned) / line.quantity);
    const addedCredit = nextCredited - line.credited_amount;
    credit += addedCredit;
    return { ...line, returned_quantity: nextReturned, credited_amount: nextCredited };
  });
  if ([...quantities.keys()].some((id) => !order.lines.some((line) => line.line_id === id))) {
    throw new AppError("A selected Order line no longer exists", 400);
  }
  return { lines, credit };
}

export async function recordOrderReturn(id: string, input: OrderReturnInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  if (current.status !== "delivered" && current.status !== "returned") throw new AppError("Only delivered Orders can record returns", 409);
  const returned = applyReturnedLines(current, input.lines);
  const allReturned = returned.lines.every((line) => line.returned_quantity === line.quantity);
  const merchandiseReturn = activity(admin, "merchandise_returned", input.reason, { credit: returned.credit });
  const order = await casUpdate(id, input.expected_revision, {
    $set: { lines: returned.lines, ...(allReturned ? { status: "returned" } : {}) },
    $push: {
      activity: allReturned
        ? { $each: [merchandiseReturn, activity(admin, "status_returned", input.reason, { from: current.status })] }
        : merchandiseReturn,
    },
  });
  return serializeOrder(order, [], true);
}

export async function recordOrderRefund(id: string, input: OrderRefundInput, admin: AuthenticatedAdmin) {
  const current = await Order.findById(id);
  if (!current) throw new AppError("Order not found", 404);
  const returnedCredit = current.lines.reduce((sum, line) => sum + line.credited_amount, 0);
  const creditDue = returnedCredit - current.financials.exchange_credit_issued - current.financials.merchandise_refunded;
  const paidBalance = current.financials.merchandise_paid_online + current.financials.cod_collected - current.financials.merchandise_refunded;
  if (input.amount > Math.min(creditDue, paidBalance)) throw new AppError("Refund exceeds the refundable paid merchandise balance", 400);
  const refunded = current.financials.merchandise_refunded + input.amount;
  const codStatus = refunded >= current.financials.cod_collected && current.financials.cod_collected > 0 ? "refunded" : "partially_refunded";
  const order = await casUpdate(id, input.expected_revision, {
    $set: { "financials.merchandise_refunded": refunded, cod_status: codStatus },
    $push: {
      refunds: { amount: input.amount, method: input.method, reference: input.reference, reason: input.reason, admin_id: admin.id, admin_email: admin.email, created_at: new Date() },
      activity: activity(admin, "merchandise_refunded", input.reason, { amount: input.amount, method: input.method }),
    },
  });
  return serializeOrder(order, [], true);
}

export async function createOrderExchange(id: string, input: OrderExchangeInput, admin: AuthenticatedAdmin) {
  const source = await Order.findById(id);
  if (!source) throw new AppError("Order not found", 404);
  if (source.status !== "delivered") throw new AppError("Only delivered Orders can be exchanged", 409);
  const returned = applyReturnedLines(source, input.returned_lines);
  const verified = await buildVerifiedCartSnapshot({
    items: input.replacement_items.map((item) => ({ ...item, name: "", price: 0 })), total: 0,
  });
  const lines: OrderLine[] = verified.items.map((item) => ({
    line_id: randomUUID(), product_id: item.product_id, name: item.name, unit_price: item.price,
    image_url: item.image_url,
    original_price: item.original_price ?? item.price, product_discount: item.discount ?? 0,
    size: item.size, color: item.color, quantity: item.quantity, allocated_order_discount: 0,
    returned_quantity: 0, credited_amount: 0,
  }));
  const replacementTotal = lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const appliedCredit = Math.min(returned.credit, replacementTotal);
  const financials = calculateFinancials({ lines, deliveryFee: 0, exchangeCreditApplied: appliedCredit });
  const replacement = await Order.create({
    order_number: await allocateOrderNumber(), customer_id: source.customer_id ?? null, name: source.name,
    phone_number: source.phone_number, normalized_phone: source.normalized_phone, email: source.email,
    normalized_email: source.normalized_email || normalizeEmail(source.email), address: source.address,
    lines, item_signature: buildItemSignature(lines), checkout_source: "exchange", status: "confirmed",
    financials, delivery_fee_status: "not_required", cod_status: financials.cod_due ? "due" : "not_required",
    exchange_source_order_id: source._id, revision: 1, guest_access_version: 1,
    activity: [{ actor_type: "admin", admin_id: admin.id, admin_email: admin.email, event: "exchange_order_created", reason: input.reason, metadata: { source_order_number: source.order_number, exchange_credit: appliedCredit }, created_at: new Date() }],
    financial_review_required: returned.credit > appliedCredit,
  });
  try {
    const updated = await casUpdate(id, input.expected_revision, {
      $set: { lines: returned.lines, status: "exchanged", exchange_replacement_order_id: replacement._id, "financials.exchange_credit_issued": source.financials.exchange_credit_issued + appliedCredit, financial_review_required: returned.credit > appliedCredit },
      $push: { activity: activity(admin, "order_exchanged", input.reason, { replacement_order_number: replacement.order_number, credit: returned.credit, applied_credit: appliedCredit }) },
    });
    return { source: serializeOrder(updated, [], true), replacement: serializeOrder(replacement, [], true) };
  } catch (error) {
    await Order.updateOne({ _id: replacement._id }, { $set: { status: "cancelled", financial_review_required: true }, $push: { activity: { actor_type: "system", event: "exchange_source_conflict", reason: "Source Order changed before exchange linkage", created_at: new Date() } } });
    throw error;
  }
}
