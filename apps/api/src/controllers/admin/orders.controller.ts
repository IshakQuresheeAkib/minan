import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../lib/errors.js";
import { parseBody } from "../../lib/parseBody.js";
import { parsePagination } from "../../lib/pagination.js";
import {
  orderCodSchema,
  orderCourierUpdateSchema,
  orderCustomerUpdateSchema,
  orderDuplicateReviewSchema,
  orderExchangeSchema,
  orderItemsUpdateSchema,
  orderListQuerySchema,
  orderNoteSchema,
  orderRefundSchema,
  orderReturnSchema,
  orderTransitionSchema,
} from "../../schemas/order.schemas.js";
import {
  appendOrderNote,
  createOrderExchange,
  exportAdminOrdersCsv,
  getAdminOrderById,
  listAdminOrders,
  listOrderChanges,
  recordOrderCod,
  recordOrderRefund,
  recordOrderReturn,
  reviewOrderDuplicate,
  transitionOrder,
  updateOrderCourier,
  updateOrderCustomer,
  updateOrderItems,
} from "../../services/adminOrders.service.js";
import { recheckPendingPayment } from "../../services/bkashPayments.service.js";

function id(req: Request): string {
  const value = req.params.id;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function admin(req: Request) {
  if (!req.admin) throw new AppError("Unauthorized", 401);
  return req.admin;
}

function queryValues(req: Request): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};
  for (const key of ["search", "status", "payment_status", "cod_status", "date_from", "date_to", "duplicate_only", "sort"]) {
    const value = req.query[key];
    values[key] = Array.isArray(value) ? String(value[0] ?? "") : typeof value === "string" ? value : undefined;
  }
  return values;
}

export async function listAdminOrdersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = parseBody(orderListQuerySchema, queryValues(req));
    res.json(await listAdminOrders(query, parsePagination(req.query)));
  } catch (error) { next(error); }
}

export async function getAdminOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await getAdminOrderById(id(req)) }); } catch (error) { next(error); }
}

export async function listOrderChangesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const value = req.query.cursor;
    const cursor = typeof value === "string" ? value : undefined;
    res.json(await listOrderChanges(cursor));
  } catch (error) { next(error); }
}

export async function exportAdminOrdersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = parseBody(orderListQuerySchema, queryValues(req));
    const csv = await exportAdminOrdersCsv(query);
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="minan-orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" });
    res.send(csv);
  } catch (error) { next(error); }
}

export async function updateOrderCustomerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await updateOrderCustomer(id(req), parseBody(orderCustomerUpdateSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function updateOrderItemsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await updateOrderItems(id(req), parseBody(orderItemsUpdateSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function transitionOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await transitionOrder(id(req), parseBody(orderTransitionSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function updateOrderCourierHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await updateOrderCourier(id(req), parseBody(orderCourierUpdateSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function recordOrderCodHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await recordOrderCod(id(req), parseBody(orderCodSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function appendOrderNoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await appendOrderNote(id(req), parseBody(orderNoteSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function reviewOrderDuplicateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await reviewOrderDuplicate(id(req), parseBody(orderDuplicateReviewSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function recordOrderReturnHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await recordOrderReturn(id(req), parseBody(orderReturnSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function recordOrderRefundHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await recordOrderRefund(id(req), parseBody(orderRefundSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function createOrderExchangeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ data: await createOrderExchange(id(req), parseBody(orderExchangeSchema, req.body), admin(req)) }); } catch (error) { next(error); }
}
export async function recheckOrderPaymentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { await recheckPendingPayment(id(req)); res.json({ data: await getAdminOrderById(id(req)) }); } catch (error) { next(error); }
}
