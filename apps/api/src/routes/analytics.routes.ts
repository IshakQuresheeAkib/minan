import rateLimit from "express-rate-limit";
import { Router } from "express";

import {
  createAnalyticsEventHandler,
  createWhatsappClickHandler,
} from "../controllers/analytics.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";

export const analyticsRouter = Router();

const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analytics requests. Please try again later." },
});

analyticsRouter.post(
  "/",
  analyticsLimiter,
  requireCsrfHeader,
  createAnalyticsEventHandler,
);

export const whatsappClickRouter = Router();

whatsappClickRouter.post(
  "/",
  analyticsLimiter,
  requireCsrfHeader,
  createWhatsappClickHandler,
);
