import type { NextFunction, Request, Response } from "express";

import { GUEST_ORDER_ACCESS_TOKEN_COOKIE } from "../config/guestOrderAccess.js";
import { verifyGuestOrderAccessToken } from "../lib/guestOrderTokens.js";
import { Order } from "../models/Order.js";
import { VerificationChallenge } from "../models/VerificationChallenge.js";

export async function requireGuestOrderAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const cookieToken = req.cookies[GUEST_ORDER_ACCESS_TOKEN_COOKIE];
  const token = bearerToken ||
    (typeof cookieToken === "string" ? cookieToken : null);

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyGuestOrderAccessToken(token);
    const now = new Date();
    const [challenge, order] = await Promise.all([
      VerificationChallenge.exists({
        _id: payload.challenge_id,
        order_id: payload.order_id,
        normalized_email: payload.normalized_email,
        purpose: "guest_order_access",
        consumed_at: { $ne: null },
        revoked_at: null,
        expires_at: { $gt: now },
      }),
      Order.exists({
        _id: payload.order_id,
        order_number: payload.order_number,
        normalized_email: payload.normalized_email,
        guest_access_version: payload.guest_access_version,
      }),
    ]);
    if (!challenge || !order) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.guestOrder = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
