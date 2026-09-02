import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { publicOrderSearchSchema } from "../schemas/publicOrderTracking.schemas.js";
import {
  PublicOrderTrackingError,
  searchPublicOrders,
} from "../services/publicOrderTracking.service.js";

export async function publicOrderSearchHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  res.set("Cache-Control", "no-store");
  try {
    const input = publicOrderSearchSchema.parse(req.body);
    res.json({ data: await searchPublicOrders(input) });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (error instanceof PublicOrderTrackingError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
}
