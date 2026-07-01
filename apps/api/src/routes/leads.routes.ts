import rateLimit from "express-rate-limit";
import { Router } from "express";

import { createLeadHandler } from "../controllers/leads.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";

export const leadsRouter = Router();

const leadCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout submissions. Please try again later." },
});

leadsRouter.post("/", leadCreateLimiter, requireCsrfHeader, createLeadHandler);
