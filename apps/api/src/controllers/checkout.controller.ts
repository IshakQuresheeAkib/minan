import { createHash } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { isBkashRestricted, isCustomerAllowedForBkash } from "../config/bkash.js";
import { getShippingConfig } from "../config/shipping.js";
import { resolveCustomerSession } from "../middleware/requireCustomerAuth.js";

export async function getCheckoutConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restricted = isBkashRestricted();
    const customer = restricted ? await resolveCustomerSession(req) : null;
    const isAllowed = !restricted || isCustomerAllowedForBkash(customer?.email);

    const baseConfig = getShippingConfig();
    const data = isAllowed
      ? baseConfig
      : {
          ...baseConfig,
          payment_contract: undefined,
        };

    const etag = `"${createHash("sha256").update(JSON.stringify(data)).digest("base64url")}"`;
    if (req.get("If-None-Match") === etag) {
      res.status(304).end();
      return;
    }
    const cacheControl = restricted
      ? "private, no-cache"
      : "public, max-age=60, stale-while-revalidate=300";
    res.set({
      ETag: etag,
      "Cache-Control": cacheControl,
      ...(restricted ? { Vary: "Cookie, Authorization" } : {}),
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

