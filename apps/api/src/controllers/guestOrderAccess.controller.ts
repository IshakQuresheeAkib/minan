import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import {
  GUEST_ORDER_ACCESS_TOKEN_COOKIE,
  getGuestOrderAccessCookieOptions,
} from "../config/guestOrderAccess.js";
import { getResendConfig } from "../config/resend.js";
import {
  guestOrderOtpRequestSchema,
  guestOrderOtpVerificationSchema,
  guestOrderPathParamsSchema,
} from "../schemas/guestOrderAccess.schemas.js";
import {
  GuestOrderAccessError,
  claimGuestOrder,
  getCustomerOrder,
  getGuestOrder,
  requestGuestOrderOtp,
  verifyGuestOrderOtp,
} from "../services/guestOrderAccess.service.js";
import { createResendEmailAdapter } from "../services/transactionalEmail.service.js";

function handleGuestOrderAccessError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (error instanceof GuestOrderAccessError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  next(error);
}

export async function guestOrderOtpRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = guestOrderOtpRequestSchema.parse(req.body);
    const email = createResendEmailAdapter(getResendConfig());
    const result = await requestGuestOrderOtp(input, email);
    res.status(202).json(result);
  } catch (error) {
    handleGuestOrderAccessError(error, res, next);
  }
}

export async function guestOrderOtpVerifyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = guestOrderOtpVerificationSchema.parse(req.body);
    const result = await verifyGuestOrderOtp(input);
    res.cookie(
      GUEST_ORDER_ACCESS_TOKEN_COOKIE,
      result.guest_access_token,
      getGuestOrderAccessCookieOptions(),
    );
    res.json({ verified: true });
  } catch (error) {
    handleGuestOrderAccessError(error, res, next);
  }
}

export async function guestOrderReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.guestOrder) {
      throw new GuestOrderAccessError("Unauthorized");
    }
    const { orderNumber } = guestOrderPathParamsSchema.parse(req.params);
    const order = await getGuestOrder(orderNumber, req.guestOrder);
    res.json({ order });
  } catch (error) {
    handleGuestOrderAccessError(error, res, next);
  }
}

export async function guestOrderClaimHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.customer || !req.guestOrder) {
      throw new GuestOrderAccessError("Unauthorized");
    }
    const { orderNumber } = guestOrderPathParamsSchema.parse(req.params);
    const result = await claimGuestOrder(
      orderNumber,
      req.customer.id,
      req.guestOrder,
    );
    res.json(result);
  } catch (error) {
    handleGuestOrderAccessError(error, res, next);
  }
}

export async function customerOrderReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.customer) {
      throw new GuestOrderAccessError("Unauthorized");
    }
    const { orderNumber } = guestOrderPathParamsSchema.parse(req.params);
    const order = await getCustomerOrder(req.customer.id, orderNumber);
    res.json({ order });
  } catch (error) {
    handleGuestOrderAccessError(error, res, next);
  }
}
