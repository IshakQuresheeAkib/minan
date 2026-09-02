import { createHash, randomUUID } from "node:crypto";

import mongoose, { type ClientSession, Types } from "mongoose";

import { getDeliveryFeeForCheckout } from "../config/shipping.js";
import { AppError } from "../lib/errors.js";
import { normalizeEmail } from "../lib/normalizeEmail.js";
import {
  Order,
  type OrderDocument,
  type OrderFinancials,
  type OrderLine,
} from "../models/Order.js";
import { OrderCounter } from "../models/OrderCounter.js";
import type { PaymentCreateInput } from "../schemas/bkash.schemas.js";
import { buildVerifiedCartSnapshot } from "./checkoutCart.service.js";
import { enqueueCustomerOrderNotification } from "./notificationOutbox.service.js";

const BANGLADESH_OFFSET_MS = 6 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CheckoutOwnershipContext =
  | { mode: "guest" }
  | { mode: "customer"; customerId: string };

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export function normalizeBangladeshPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}

export function buildItemSignature(
  items: readonly Pick<OrderLine, "product_id" | "size" | "color" | "quantity">[],
): string {
  const canonical = items
    .map((item) => `${item.product_id}:${item.size.trim().toLowerCase()}:${item.color.trim().toLowerCase()}:${item.quantity}`)
    .sort()
    .join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export function allocateOrderDiscount(lines: OrderLine[], discount: number): OrderLine[] {
  const subtotal = lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  if (!Number.isSafeInteger(discount) || discount < 0 || discount > subtotal) {
    throw new AppError("Order discount must be a whole amount within the subtotal", 400);
  }
  if (subtotal === 0 || discount === 0) {
    return lines.map((line) => ({ ...line, allocated_order_discount: 0 }));
  }

  let allocated = 0;
  return lines.map((line, index) => {
    const lineGross = line.unit_price * line.quantity;
    const lineDiscount = index === lines.length - 1
      ? discount - allocated
      : Math.floor((discount * lineGross) / subtotal);
    allocated += lineDiscount;
    return { ...line, allocated_order_discount: lineDiscount };
  });
}

export function calculateFinancials(input: {
  lines: readonly OrderLine[];
  orderDiscount?: number;
  deliveryFee: number;
  merchandisePaidOnline?: number;
  exchangeCreditApplied?: number;
  codCollected?: number;
  merchandiseRefunded?: number;
  exchangeCreditIssued?: number;
}): OrderFinancials {
  const merchandiseSubtotal = input.lines.reduce(
    (sum, line) => sum + line.unit_price * line.quantity,
    0,
  );
  const orderDiscount = input.orderDiscount ?? 0;
  const merchandiseTotal = merchandiseSubtotal - orderDiscount;
  const merchandisePaidOnline = input.merchandisePaidOnline ?? 0;
  const exchangeCreditApplied = input.exchangeCreditApplied ?? 0;
  const codDue = Math.max(merchandiseTotal - merchandisePaidOnline - exchangeCreditApplied, 0);
  return {
    merchandise_subtotal: merchandiseSubtotal,
    order_discount: orderDiscount,
    merchandise_total: merchandiseTotal,
    delivery_fee: input.deliveryFee,
    overall_order_value: merchandiseTotal + input.deliveryFee,
    merchandise_paid_online: merchandisePaidOnline,
    exchange_credit_applied: exchangeCreditApplied,
    cod_due: codDue,
    cod_collected: input.codCollected ?? 0,
    merchandise_refunded: input.merchandiseRefunded ?? 0,
    exchange_credit_issued: input.exchangeCreditIssued ?? 0,
  };
}

function bangladeshDateKey(date = new Date()): string {
  const local = new Date(date.getTime() + BANGLADESH_OFFSET_MS);
  return [
    local.getUTCFullYear(),
    String(local.getUTCMonth() + 1).padStart(2, "0"),
    String(local.getUTCDate()).padStart(2, "0"),
  ].join("");
}

export async function allocateOrderNumber(
  date = new Date(),
  session?: ClientSession,
): Promise<string> {
  const dateKey = bangladeshDateKey(date);
  let counter;
  try {
    counter = await OrderCounter.findOneAndUpdate(
      { _id: dateKey },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) },
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    counter = await OrderCounter.findOneAndUpdate(
      { _id: dateKey },
      { $inc: { sequence: 1 } },
      { new: true, ...(session ? { session } : {}) },
    );
  }
  if (!counter) throw new AppError("Could not allocate an order number", 503);
  return `MN-${dateKey}-${String(counter.sequence).padStart(4, "0")}`;
}

export function checkoutRequestMatchesOrder(
  input: PaymentCreateInput,
  order: OrderDocument,
): boolean {
  if (
    input.name !== order.name ||
    normalizeBangladeshPhone(input.phone_number) !== order.normalized_phone ||
    normalizeEmail(input.email) !== (order.normalized_email || normalizeEmail(order.email)) ||
    input.address !== order.address ||
    (input.notes ?? "") !== (order.customer_notes ?? "") ||
    input.checkout_source !== order.checkout_source ||
    input.shipping_zone !== order.shipping_zone ||
    input.cart_snapshot.items.length !== order.lines.length
  ) {
    return false;
  }
  return input.cart_snapshot.items.every((item, index) => {
    const line = order.lines[index];
    return line !== undefined && item.product_id === line.product_id && item.size === line.size &&
      item.color === line.color && item.quantity === line.quantity;
  });
}

export function checkoutOwnershipMatchesOrder(
  order: OrderDocument,
  ownership: CheckoutOwnershipContext,
): boolean {
  // Historical Orders created before the ownership field was introduced can
  // still deserialize without the default value; they are unowned guests.
  if (ownership.mode === "guest") return !order.customer_id;
  return order.customer_id?.toString() === ownership.customerId;
}

async function linkPossibleDuplicates(order: OrderDocument): Promise<void> {
  const duplicates = await Order.find({
    _id: { $ne: order._id },
    normalized_phone: order.normalized_phone,
    item_signature: order.item_signature,
    createdAt: { $gte: new Date(order.createdAt.getTime() - DUPLICATE_WINDOW_MS) },
  }).select("_id");
  if (duplicates.length === 0) return;
  const ids = duplicates.map((item) => item._id);
  await Promise.all([
    Order.updateOne(
      { _id: order._id },
      {
        $addToSet: { duplicate_order_ids: { $each: ids } },
        $set: { duplicate_review_state: "pending" },
      },
    ),
    Order.updateMany(
      { _id: { $in: ids } },
      {
        $addToSet: { duplicate_order_ids: order._id },
        $set: { duplicate_review_state: "pending" },
      },
    ),
  ]);
  order.duplicate_order_ids = ids;
  order.duplicate_review_state = "pending";
}

export async function createOrLoadCheckoutOrder(
  input: PaymentCreateInput,
  idempotencyHash: string,
  ownership: CheckoutOwnershipContext = { mode: "guest" },
): Promise<OrderDocument> {
  let order = await Order.findOne({ checkout_idempotency_hash: idempotencyHash }).select(
    "+checkout_idempotency_hash",
  );
  if (order) {
    if (!checkoutOwnershipMatchesOrder(order, ownership)) {
      throw new AppError("CHECKOUT_OWNERSHIP_CHANGED", 409);
    }
    return order;
  }

  const cart = await buildVerifiedCartSnapshot(input.cart_snapshot);
  const lines: OrderLine[] = cart.items.map((item) => ({
    line_id: randomUUID(),
    product_id: item.product_id,
    name: item.name,
    image_url: item.image_url,
    unit_price: item.price,
    original_price: item.original_price ?? item.price,
    product_discount: item.discount ?? 0,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    allocated_order_discount: 0,
    returned_quantity: 0,
    credited_amount: 0,
  }));
  const deliveryFee = getDeliveryFeeForCheckout(input.shipping_zone);
  const now = new Date();
  const normalizedPhone = normalizeBangladeshPhone(input.phone_number);
  try {
    order = await mongoose.connection.transaction(async (session) => {
      const orders = await Order.create([{
        order_number: await allocateOrderNumber(now, session),
        customer_id: ownership.mode === "customer" ? ownership.customerId : null,
        name: input.name,
        phone_number: input.phone_number,
        normalized_phone: normalizedPhone,
        email: input.email,
        normalized_email: normalizeEmail(input.email),
        address: input.address,
        customer_notes: input.notes,
        lines,
        item_signature: buildItemSignature(lines),
        checkout_source: input.checkout_source,
        shipping_zone: input.shipping_zone,
        payment_method: input.payment_method,
        checkout_idempotency_hash: idempotencyHash,
        status: "new",
        financials: calculateFinancials({ lines, deliveryFee }),
        delivery_fee_status: "awaiting",
        cod_status: cart.total > 0 ? "due" : "not_required",
        revision: 1,
        guest_access_version: 1,
        activity: [{
          actor_type: "customer",
          event: "order_created",
          metadata: {
            checkout_source: input.checkout_source,
            shipping_zone: input.shipping_zone,
            payment_method: input.payment_method,
          },
          created_at: now,
        }],
      }], { session });
      const created = orders[0];
      if (!created) throw new AppError("Order creation did not return an Order", 500);
      await enqueueCustomerOrderNotification(created, "order_created", session);
      return created;
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    order = await Order.findOne({ checkout_idempotency_hash: idempotencyHash }).select(
      "+checkout_idempotency_hash",
    );
    if (!order) throw error;
  }
  if (!checkoutOwnershipMatchesOrder(order, ownership)) {
    throw new AppError("CHECKOUT_OWNERSHIP_CHANGED", 409);
  }
  await linkPossibleDuplicates(order);
  return order;
}

export async function requireOrder(id: string): Promise<OrderDocument> {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid order id", 400);
  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  return order;
}
