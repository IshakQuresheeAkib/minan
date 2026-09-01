import type { FilterQuery } from "mongoose";

import { decodeOrderCursor, encodeOrderCursor } from "../lib/orderCursor.js";
import { Order, type OrderDocument } from "../models/Order.js";
import { normalizeBangladeshPhone } from "./orders.service.js";
import {
  serializeCustomerOrder,
  serializeCustomerOrderSummary,
  type CustomerOrderTrackingDTO,
  type CustomerOrderSummaryDTO,
} from "../utils/serializeCustomerOrder.js";

const ORDER_NUMBER = /^MN-\d{8}-\d{4}$/;
const BANGLADESH_MOBILE = /^01[3-9]\d{8}$/;

export type PublicOrderSearchInput = {
  query: string;
  cursor?: string;
  limit: number;
};

export type PublicOrderSearchResult =
  | { kind: "order"; order: CustomerOrderTrackingDTO }
  | { kind: "phone"; orders: CustomerOrderSummaryDTO[]; next_cursor: string | null };

export class PublicOrderTrackingError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicOrderTrackingError";
    this.status = status;
  }
}

function notFound(): PublicOrderTrackingError {
  return new PublicOrderTrackingError("Not found", 404);
}

function pageAfter(cursor: string): FilterQuery<OrderDocument> {
  const decoded = decodeOrderCursor(cursor);
  return {
    $or: [
      { createdAt: { $lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, _id: { $lt: decoded.id } },
    ],
  };
}

export async function searchPublicOrders(
  input: PublicOrderSearchInput,
): Promise<PublicOrderSearchResult> {
  const query = input.query.trim();
  const orderNumber = query.toUpperCase();
  if (ORDER_NUMBER.test(orderNumber)) {
    if (input.cursor) throw notFound();
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) throw notFound();
    return { kind: "order", order: serializeCustomerOrder(order) };
  }

  const phone = normalizeBangladeshPhone(query);
  if (!BANGLADESH_MOBILE.test(phone)) throw notFound();

  let filter: FilterQuery<OrderDocument> = { normalized_phone: phone };
  if (input.cursor) {
    filter = { ...filter, ...pageAfter(input.cursor) };
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(input.limit + 1);
  if (orders.length === 0 && !input.cursor) throw notFound();

  const page = orders.slice(0, input.limit);
  const last = page.at(-1);
  return {
    kind: "phone",
    orders: page.map(serializeCustomerOrderSummary),
    next_cursor: orders.length > input.limit && last
      ? encodeOrderCursor({ createdAt: last.createdAt, id: last._id })
      : null,
  };
}
