import type { NextFunction, Request, Response } from "express";

import { CUSTOMER_ACCESS_TOKEN_COOKIE } from "../config/customerAuth.js";
import { verifyCustomerAccessToken } from "../lib/customerTokens.js";
import { Customer } from "../models/Customer.js";
import { CustomerSession } from "../models/CustomerSession.js";

export async function requireCustomerAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const cookieToken = req.cookies[CUSTOMER_ACCESS_TOKEN_COOKIE];
  const token = bearerToken ||
    (typeof cookieToken === "string" ? cookieToken : null);

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyCustomerAccessToken(token);
    const now = new Date();
    const [customer, session] = await Promise.all([
      Customer.exists({
        _id: payload.id,
        normalized_email: payload.email,
        is_active: true,
        session_version: payload.session_version,
      }),
      CustomerSession.exists({
        _id: payload.session_id,
        customer_id: payload.id,
        session_version: payload.session_version,
        revoked_at: null,
        expires_at: { $gt: now },
      }),
    ]);

    if (!customer || !session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.customer = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
