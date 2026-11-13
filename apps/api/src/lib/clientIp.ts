import type { Request } from "express";

/**
 * Extracts client IP for attribution (Meta CAPI / analytics).
 * Traverses X-Forwarded-For to find the originating client before proxy hops (Vercel/Render).
 * Preserves Express req.ip for rate-limiting trust boundaries.
 */
export function getAttributionIp(req: Request): string | undefined {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (req.headers?.["x-real-ip"] as string) || req.ip;
}
