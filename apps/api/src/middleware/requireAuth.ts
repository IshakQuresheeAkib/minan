import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/tokens.js";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
