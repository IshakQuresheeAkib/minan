import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { customerOrderListQuerySchema } from "../schemas/publicOrderTracking.schemas.js";
import { guestOrderPathParamsSchema } from "../schemas/guestOrderAccess.schemas.js";
import {
  CustomerOrderHistoryError,
  getCustomerOrderHistory,
  getOwnedCustomerOrder,
} from "../services/customerOrderHistory.service.js";

function handleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (error instanceof CustomerOrderHistoryError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  next(error);
}

export async function customerOrderListHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  res.set("Cache-Control", "no-store");
  try {
    if (!req.customer) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const input = customerOrderListQuerySchema.parse(req.query);
    res.json({ data: await getCustomerOrderHistory(req.customer.id, input) });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function customerOrderDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  res.set("Cache-Control", "no-store");
  try {
    if (!req.customer) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { orderNumber } = guestOrderPathParamsSchema.parse(req.params);
    res.json({ order: await getOwnedCustomerOrder(req.customer.id, orderNumber) });
  } catch (error) {
    handleError(error, res, next);
  }
}
