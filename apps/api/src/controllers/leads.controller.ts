import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../lib/parseBody.js";
import { leadCreateSchema } from "../schemas/lead.schemas.js";
import { createLead } from "../services/leads.service.js";

export async function createLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(leadCreateSchema, req.body);
    const lead = await createLead(input);

    res.status(201).json({ data: lead });
  } catch (error) {
    next(error);
  }
}
