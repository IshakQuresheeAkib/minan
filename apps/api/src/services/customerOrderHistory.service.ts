import type { QueryFilter } from "mongoose";

import { decodeOrderCursor, encodeOrderCursor } from "../lib/orderCursor.js";
import { Order, type OrderDocument } from "../models/Order.js";
import {
  serializeCustomerOrder,
  serializeCustomerOrderSummary,
  type CustomerOrderSummaryDTO,
  type CustomerOrderTrackingDTO,
} from "../utils/serializeCustomerOrder.js";

export class CustomerOrderHistoryError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CustomerOrderHistoryError";
    this.status = status;
  }
}

export type CustomerOrderHistoryPage = {
  orders: CustomerOrderSummaryDTO[];
  next_cursor: string | null;
};

type CustomerHistoryInput = { cursor?: string; limit: number };

function afterCursor(cursor: string): QueryFilter<OrderDocument> {
  const decoded = decodeOrderCursor(cursor);
  return {
    $or: [
      { createdAt: { $lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, _id: { $lt: decoded.id } },
    ],
  };
}

export async function getCustomerOrderHistory(
  customerId: string,
  input: CustomerHistoryInput,
): Promise<CustomerOrderHistoryPage> {
  let filter: QueryFilter<OrderDocument> = { customer_id: customerId };
  if (input.cursor) filter = { ...filter, ...afterCursor(input.cursor) };
  const orders = await Order.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(input.limit + 1);
  const page = orders.slice(0, input.limit);
  const last = page.at(-1);
  return {
    orders: page.map(serializeCustomerOrderSummary),
    next_cursor: orders.length > input.limit && last
      ? encodeOrderCursor({ createdAt: last.createdAt, id: last._id })
      : null,
  };
}

export async function getOwnedCustomerOrder(
  customerId: string,
  orderNumber: string,
): Promise<CustomerOrderTrackingDTO> {
  const order = await Order.findOne({ customer_id: customerId, order_number: orderNumber });
  if (!order) throw new CustomerOrderHistoryError("Not found", 404);
  return serializeCustomerOrder(order);
}
