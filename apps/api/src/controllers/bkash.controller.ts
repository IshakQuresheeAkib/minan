import type { NextFunction, Request, Response } from "express";

import { getBkashConfig } from "../config/bkash.js";
import { AppError } from "../lib/errors.js";
import { parseBody } from "../lib/parseBody.js";
import {
  bkashCallbackSchema,
  paymentCreateSchema,
  paymentResultResolveSchema,
  paymentRetrySchema,
} from "../schemas/bkash.schemas.js";
import {
  handleBkashCallback,
  resolvePaymentResult,
  retryBkashPayment,
  startBkashPayment,
} from "../services/bkashPayments.service.js";

function idempotencyKey(req: Request): string {
  const value = req.get("Idempotency-Key")?.trim();
  if (!value || value.length < 16 || value.length > 128) {
    throw new AppError("A valid Idempotency-Key header is required", 400);
  }
  return value;
}

export async function createBkashPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(paymentCreateSchema, req.body);
    res.json({ data: await startBkashPayment(input, idempotencyKey(req)) });
  } catch (error) {
    next(error);
  }
}

export async function bkashCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(bkashCallbackSchema, req.query);
    const reference = await handleBkashCallback(input);
    const resultUrl = new URL("/payment/result", `${getBkashConfig().frontendUrl}/`);
    resultUrl.searchParams.set("reference", reference);
    res.redirect(303, resultUrl.toString());
  } catch (error) {
    next(error);
  }
}

export async function resolveBkashResultHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(paymentResultResolveSchema, req.body);
    res.json({ data: await resolvePaymentResult(input.reference) });
  } catch (error) {
    next(error);
  }
}

export async function retryBkashPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(paymentRetrySchema, req.body);
    res.json({ data: await retryBkashPayment(input) });
  } catch (error) {
    next(error);
  }
}
