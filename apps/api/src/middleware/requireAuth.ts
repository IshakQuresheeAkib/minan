import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/tokens.js";
import { AdminUser } from "../models/AdminUser.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const sessionVersionFilter =
      payload.session_version === 0
        ? {
            $or: [
              { session_version: 0 },
              { session_version: { $exists: false } },
            ],
          }
        : { session_version: payload.session_version };
    const admin = await AdminUser.exists({
      _id: payload.id,
      email: payload.email,
      is_active: true,
      ...sessionVersionFilter,
    });

    if (!admin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
