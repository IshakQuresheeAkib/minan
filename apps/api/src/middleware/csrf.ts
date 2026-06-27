import type { NextFunction, Request, Response } from "express";

export function requireCsrfHeader(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.get("X-Requested-With");
  if (header !== "XMLHttpRequest") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
