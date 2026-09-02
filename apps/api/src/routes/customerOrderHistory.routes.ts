import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  customerOrderDetailHandler,
  customerOrderListHandler,
} from "../controllers/customerOrderHistory.controller.js";
import { requireCustomerAuth } from "../middleware/requireCustomerAuth.js";

export function createCustomerOrderHistoryRouter(): Router {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `customer-orders:${req.customer?.id ?? "unauthenticated"}`,
    message: { error: "Too many requests. Try again later." },
  });

  router.use(requireCustomerAuth, limiter);
  router.get("/", customerOrderListHandler);
  router.get("/:orderNumber", customerOrderDetailHandler);
  return router;
}

export const customerOrderHistoryRouter = createCustomerOrderHistoryRouter();
