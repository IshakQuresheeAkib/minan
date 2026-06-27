import type { NextFunction, Request, Response } from "express";

import {
  getProductBySlug,
  listProducts,
} from "../services/products.service.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export async function listProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    const pageParam = req.query.page;
    const limitParam = req.query.limit;
    const page =
      typeof pageParam === "string"
        ? Number.parseInt(pageParam, 10)
        : undefined;
    const limit =
      typeof limitParam === "string"
        ? Number.parseInt(limitParam, 10)
        : undefined;

    const result = await listProducts({
      categorySlug: category,
      page: page !== undefined && !Number.isNaN(page) ? page : undefined,
      limit: limit !== undefined && !Number.isNaN(limit) ? limit : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlugHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    if (!slug) {
      res.status(400).json({ error: "Product slug is required" });
      return;
    }

    const product = await getProductBySlug(slug);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ data: serializeProduct(product) });
  } catch (error) {
    next(error);
  }
}
