import { createHash } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { getShippingConfig } from "../config/shipping.js";

export function getCheckoutConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const data = getShippingConfig();
    const etag = `"${createHash("sha256").update(JSON.stringify(data)).digest("base64url")}"`;
    if (req.get("If-None-Match") === etag) {
      res.status(304).end();
      return;
    }
    res.set({ ETag: etag, "Cache-Control": "public, max-age=60, stale-while-revalidate=300" });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
