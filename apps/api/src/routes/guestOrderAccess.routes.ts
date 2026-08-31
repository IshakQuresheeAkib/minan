import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  customerOrderReadHandler,
  guestOrderClaimHandler,
  guestOrderOtpRequestHandler,
  guestOrderOtpVerifyHandler,
  guestOrderReadHandler,
} from "../controllers/guestOrderAccess.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { requireCustomerAuth } from "../middleware/requireCustomerAuth.js";
import { requireGuestOrderAccess } from "../middleware/requireGuestOrderAccess.js";

function guestOrderRateLimiter(max: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
}

export function createGuestOrderAccessRouter(): Router {
  const router = Router();
  const requestOtpRateLimiter = guestOrderRateLimiter(
    5,
    "Too many access code requests. Try again later.",
  );
  const verifyOtpRateLimiter = guestOrderRateLimiter(
    10,
    "Too many verification attempts. Try again later.",
  );

  router.post(
    "/otp/request",
    requireCsrfHeader,
    requestOtpRateLimiter,
    guestOrderOtpRequestHandler,
  );
  router.post(
    "/otp/verify",
    requireCsrfHeader,
    verifyOtpRateLimiter,
    guestOrderOtpVerifyHandler,
  );
  router.get("/orders/:orderNumber", requireGuestOrderAccess, guestOrderReadHandler);
  router.post(
    "/orders/:orderNumber/claim",
    requireCsrfHeader,
    requireCustomerAuth,
    requireGuestOrderAccess,
    guestOrderClaimHandler,
  );

  return router;
}

export function createCustomerOrdersRouter(): Router {
  const router = Router();
  router.get("/:orderNumber", requireCustomerAuth, customerOrderReadHandler);
  return router;
}

export const guestOrderAccessRouter = createGuestOrderAccessRouter();
export const customerOrdersRouter = createCustomerOrdersRouter();
