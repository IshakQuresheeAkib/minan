import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  customerLoginHandler,
  customerLogoutHandler,
  customerMeHandler,
  customerRefreshHandler,
  customerSignupHandler,
} from "../controllers/customerAuth.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { requireCustomerAuth } from "../middleware/requireCustomerAuth.js";

function customerAuthRateLimiter(max: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
}

export function createCustomerAuthRouter(): Router {
  const router = Router();
  const signupRateLimiter = customerAuthRateLimiter(
    5,
    "Too many signup attempts. Try again later.",
  );
  const loginRateLimiter = customerAuthRateLimiter(
    10,
    "Too many login attempts. Try again later.",
  );
  const refreshRateLimiter = customerAuthRateLimiter(
    30,
    "Too many session requests. Try again later.",
  );

  router.post(
    "/signup",
    requireCsrfHeader,
    signupRateLimiter,
    customerSignupHandler,
  );
  router.post(
    "/login",
    requireCsrfHeader,
    loginRateLimiter,
    customerLoginHandler,
  );
  router.post(
    "/refresh",
    requireCsrfHeader,
    refreshRateLimiter,
    customerRefreshHandler,
  );
  router.post("/logout", requireCsrfHeader, customerLogoutHandler);
  router.get("/me", requireCustomerAuth, customerMeHandler);

  return router;
}

export const customerAuthRouter = createCustomerAuthRouter();
