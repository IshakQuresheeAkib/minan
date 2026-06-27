import type { NextFunction, Request, Response } from "express";

export async function getDashboardHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({
      leadsToday: 0,
      leadsThisMonth: 0,
      topProduct: null,
      topCategory: null,
      trafficSources: [],
    });
  } catch (error) {
    next(error);
  }
}
