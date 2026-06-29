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
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

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

    if (
      typeof pageParam === "string" &&
      (page === undefined || Number.isNaN(page) || page < 1)
    ) {
      res.status(400).json({ error: "page must be a positive integer" });
      return;
    }

    if (
      typeof limitParam === "string" &&
      (limit === undefined || Number.isNaN(limit) || limit < 1)
    ) {
      res.status(400).json({ error: "limit must be a positive integer" });
      return;
    }

    const result = await listProducts({
      categorySlug: category,
      search,
      page,
      limit,
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
