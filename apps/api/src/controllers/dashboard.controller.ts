import type { NextFunction, Request, Response } from "express";

import { getDashboardMetrics } from "../services/dashboard.service.js";

export async function getDashboardHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const metrics = await getDashboardMetrics();

    res.json(metrics);
  } catch (error) {
    next(error);
  }
}