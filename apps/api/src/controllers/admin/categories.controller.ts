import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../../lib/parseBody.js";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "../../schemas/admin.schemas.js";
import {
  createAdminCategory,
  deactivateAdminCategory,
  listAdminCategories,
  updateAdminCategory,
} from "../../services/adminCategories.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export async function listAdminCategoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listAdminCategories();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdminCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(categoryCreateSchema, req.body);
    const category = await createAdminCategory(input);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(categoryUpdateSchema, req.body);
    const category = await updateAdminCategory(getIdParam(req), input);
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await deactivateAdminCategory(getIdParam(req));
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}
