import type { NextFunction, Request, Response } from "express";

import {
  getProductFilterOptions,
  getProductBySlug,
  listProducts,
  type ProductSortOption,
} from "../services/products.service.js";
import { serializeProduct } from "../utils/serializeProduct.js";

function getQueryValues(value: Request["query"][string]): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function parseMoneyParam(value: string | undefined): number | null | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseSortParam(value: string | undefined): ProductSortOption | null {
  if (value === undefined || value === "") {
    return "newest";
  }

  if (
    value === "newest" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "name-asc"
  ) {
    return value;
  }

  return null;
}

export async function listProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categorySlugs = getQueryValues(req.query.category);
    const subcategorySlugs =
      categorySlugs.length > 0
        ? getQueryValues(req.query.subcategory)
        : [];
    const colors = getQueryValues(req.query.color);
    const sizes = getQueryValues(req.query.size);
    const search = getQueryParam(req, "search")?.trim();
    const minPrice = parseMoneyParam(getQueryParam(req, "minPrice"));
    const maxPrice = parseMoneyParam(getQueryParam(req, "maxPrice"));
    const sort = parseSortParam(getQueryParam(req, "sort"));

    if (minPrice === null) {
      res.status(400).json({ error: "minPrice must be a positive number" });
      return;
    }

    if (maxPrice === null) {
      res.status(400).json({ error: "maxPrice must be a positive number" });
      return;
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      res.status(400).json({ error: "minPrice cannot be greater than maxPrice" });
      return;
    }

    if (!sort) {
      res
        .status(400)
        .json({ error: "sort must be one of newest, price-asc, price-desc, name-asc" });
      return;
    }

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

    const exclude =
      typeof req.query.exclude === "string" ? req.query.exclude : undefined;

    const result = await listProducts({
      categorySlugs,
      subcategorySlugs,
      search,
      page,
      limit,
      excludeSlug: exclude,
      colors,
      sizes,
      minPrice,
      maxPrice,
      sort,
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

export async function getProductFilterOptionsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getProductFilterOptions();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
