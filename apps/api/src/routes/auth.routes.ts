import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  loginHandler,
  logoutHandler,
  refreshHandler,
} from "../controllers/auth.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, requireCsrfHeader, loginHandler);
authRouter.post("/refresh", requireCsrfHeader, refreshHandler);
authRouter.post("/logout", requireCsrfHeader, logoutHandler);
