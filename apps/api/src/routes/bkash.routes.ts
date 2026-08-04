import { createHash } from "node:crypto";

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Router } from "express";

import {
  bkashCallbackHandler,
  createBkashPaymentHandler,
  resolveBkashResultHandler,
  retryBkashPaymentHandler,
} from "../controllers/bkash.controller.js";
import { opaqueTokenRateLimitKey } from "../lib/rateLimitKeys.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { Lead } from "../models/Lead.js";

export const bkashRouter = Router();

const paymentIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment requests. Please try again later." },
});
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please try again later." },
  skip: async (req) => {
    const key = req.get("Idempotency-Key")?.trim();
    if (!key || key.length < 16 || key.length > 128) return false;
    const digest = createHash("sha256").update(key).digest("hex");
    return Boolean(await Lead.exists({ checkout_idempotency_hash: digest }));
  },
});
const resolveIpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment result requests. Please try again later." },
});
const resolveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    opaqueTokenRateLimitKey(
      "bkash-result",
      req.body?.reference,
      ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "unknown"),
    ),
});

bkashRouter.post(
  "/payments",
  paymentIpLimiter,
  requireCsrfHeader,
  createLimiter,
  createBkashPaymentHandler,
);
// bKash performs this browser redirect, so it intentionally bypasses XHR CSRF checks.
bkashRouter.get("/callback", bkashCallbackHandler);
bkashRouter.post(
  "/results/resolve",
  resolveIpLimiter,
  requireCsrfHeader,
  resolveLimiter,
  resolveBkashResultHandler,
);
bkashRouter.post(
  "/payments/retry",
  paymentIpLimiter,
  requireCsrfHeader,
  createLimiter,
  retryBkashPaymentHandler,
);
