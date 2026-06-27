import { Router } from "express";

import { getDashboardHandler } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const adminRouter = Router();

adminRouter.get(
  "/dashboard",
  requireAuth,
  requireRole(["general", "premium"]),
  getDashboardHandler,
);
