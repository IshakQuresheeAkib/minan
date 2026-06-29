import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../../lib/parseBody.js";
import { parsePagination } from "../../lib/pagination.js";
import { leadUpdateSchema } from "../../schemas/admin.schemas.js";
import {
  getAdminLeadById,
  listAdminLeads,
  updateAdminLead,
} from "../../services/adminLeads.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export async function listAdminLeadsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const result = await listAdminLeads(pagination);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const lead = await getAdminLeadById(getIdParam(req));
    res.json({ data: lead });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(leadUpdateSchema, req.body);
    const lead = await updateAdminLead(getIdParam(req), input);
    res.json({ data: lead });
  } catch (error) {
    next(error);
  }
}
