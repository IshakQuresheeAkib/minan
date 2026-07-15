import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../../lib/parseBody.js";
import {
  subcategoryCreateSchema,
  subcategoryReorderSchema,
  subcategoryUpdateSchema,
} from "../../schemas/admin.schemas.js";
import {
  createAdminSubcategory,
  deactivateAdminSubcategory,
  listAdminSubcategories,
  reactivateAdminSubcategory,
  reorderAdminSubcategories,
  updateAdminSubcategory,
} from "../../services/adminSubcategories.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export async function listAdminSubcategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categoryId =
      typeof req.query.category_id === "string"
        ? req.query.category_id.trim()
        : undefined;
    const result = await listAdminSubcategories(categoryId || undefined);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdminSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(subcategoryCreateSchema, req.body);
    const subcategory = await createAdminSubcategory(input);
    res.status(201).json({ data: subcategory });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(subcategoryUpdateSchema, req.body);
    const subcategory = await updateAdminSubcategory(getIdParam(req), input);
    res.json({ data: subcategory });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subcategory = await deactivateAdminSubcategory(getIdParam(req));
    res.json({ data: subcategory });
  } catch (error) {
    next(error);
  }
}

export async function reactivateAdminSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subcategory = await reactivateAdminSubcategory(getIdParam(req));
    res.json({ data: subcategory });
  } catch (error) {
    next(error);
  }
}

export async function reorderAdminSubcategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(subcategoryReorderSchema, req.body);
    const result = await reorderAdminSubcategories(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
