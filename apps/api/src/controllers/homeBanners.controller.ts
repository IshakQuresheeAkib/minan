import type { NextFunction, Request, Response } from "express";

import { listHomeBanners } from "../services/homeBanners.service.js";

export async function listHomeBannersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await listHomeBanners());
  } catch (error) {
    next(error);
  }
}
