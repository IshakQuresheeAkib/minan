import { createHash } from "node:crypto";

import { Router, type Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import rateLimit from "express-rate-limit";

import { publicOrderSearchHandler } from "../controllers/publicOrderTracking.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";

const ORDER_NUMBER = /^MN-\d{8}-\d{4}$/i;

function publicIpKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? "unknown");
}

function requestQuery(req: Request): string | null {
  const query = req.body && typeof req.body === "object" ? req.body.query : undefined;
  return typeof query === "string" ? query.trim() : null;
}

function genericPublicLimiter(max: number, keyGenerator?: (req: Request) => string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { error: "Too many requests. Try again later." },
  });
}

export function createPublicOrderTrackingRouter(): Router {
  const router = Router();
  const orderAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: (req) => !ORDER_NUMBER.test(requestQuery(req) ?? ""),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: publicIpKey,
    message: { error: "Too many requests. Try again later." },
  });
  const repeatedFirstPageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skip: (req) => {
      const body = req.body;
      return !body || typeof body !== "object" ||
        typeof body.cursor === "string" || requestQuery(req) === null;
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const query = requestQuery(req) ?? "";
      const digest = createHash("sha256").update(query.toLowerCase()).digest("hex");
      return `public-search:${publicIpKey(req)}:${digest}`;
    },
    message: { error: "Too many requests. Try again later." },
  });

  router.post(
    "/search",
    requireCsrfHeader,
    genericPublicLimiter(60, publicIpKey),
    orderAttemptLimiter,
    repeatedFirstPageLimiter,
    publicOrderSearchHandler,
  );
  return router;
}

export const publicOrderTrackingRouter = createPublicOrderTrackingRouter();
