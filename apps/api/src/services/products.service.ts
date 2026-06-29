import type { Types } from "mongoose";

import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export type ListProductsOptions = {
  categorySlug?: string;
  page?: number;
  limit?: number;
};

export async function listProducts(options: ListProductsOptions = {}) {
  const filter: {
    is_active: boolean;
    category_id?: Types.ObjectId;
  } = { is_active: true };

  if (options.categorySlug) {
    const category = await Category.findOne({
      slug: options.categorySlug,
      is_active: true,
    }).select("_id");

    if (!category) {
      return { data: [], total: 0 };
    }

    filter.category_id = category._id;
  }

  let query = Product.find(filter)
    .populate("category_id")
    .sort({ createdAt: -1 });

  if (options.limit !== undefined && options.limit >= 1) {
    const page = Math.max(1, options.page ?? 1);
    query = query.skip((page - 1) * options.limit).limit(options.limit);
  }

  const [products, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  return {
    data: products.map(serializeProduct),
    total,
  };
}

export async function getProductBySlug(slug: string) {
  return Product.findOne({ slug, is_active: true }).populate("category_id");
}
