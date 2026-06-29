import type { NextFunction, Request, Response } from "express";

import { parseBody } from "../../lib/parseBody.js";
import { parsePagination } from "../../lib/pagination.js";
import {
  productCreateSchema,
  productUpdateSchema,
} from "../../schemas/admin.schemas.js";
import {
  createAdminProduct,
  deactivateAdminProduct,
  listAdminProducts,
  updateAdminProduct,
} from "../../services/adminProducts.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export async function listAdminProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const result = await listAdminProducts(pagination);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAdminProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(productCreateSchema, req.body);
    const product = await createAdminProduct(input);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(productUpdateSchema, req.body);
    const product = await updateAdminProduct(getIdParam(req), input);
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await deactivateAdminProduct(getIdParam(req));
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}
