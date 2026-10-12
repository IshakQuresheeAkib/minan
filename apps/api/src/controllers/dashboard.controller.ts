import type { NextFunction, Request, Response } from "express";

import { getDashboardMetrics } from "../services/dashboard.service.js";

export async function getDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminEmail = req.admin?.email;
    const metrics = await getDashboardMetrics(adminEmail);

    res.json(metrics);
  } catch (error) {
    next(error);
  }
}