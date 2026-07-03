import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

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
  type AdminProductStatusFilter,
  updateAdminProduct,
} from "../../services/adminProducts.service.js";

function getIdParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function parseStatusFilter(
  status: string | undefined,
): AdminProductStatusFilter | null {
  if (status === undefined || status === "") {
    return "all";
  }

  if (status === "all" || status === "active" || status === "inactive") {
    return status;
  }

  return null;
}

export async function listAdminProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const search = getQueryParam(req, "search")?.trim();
    const categoryId = getQueryParam(req, "category_id")?.trim();
    const status = parseStatusFilter(getQueryParam(req, "status"));

    if (!status) {
      res
        .status(400)
        .json({ error: "status must be one of all, active, inactive" });
      return;
    }

    if (categoryId && !Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ error: "category_id must be a valid ObjectId" });
      return;
    }

    const result = await listAdminProducts({
      ...pagination,
      filters: {
        search,
        categoryId,
        status,
      },
    });
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
