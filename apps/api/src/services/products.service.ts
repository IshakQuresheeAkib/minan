import type { Types } from "mongoose";

import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export type ListProductsOptions = {
  categorySlug?: string;
  search?: string;
  page?: number;
  limit?: number;
  excludeSlug?: string;
};

type SearchCondition = {
  name?: { $regex: string; $options: "i" };
  description?: { $regex: string; $options: "i" };
  slug?: { $regex: string; $options: "i" };
};

type ProductFilter = {
  is_active: boolean;
  category_id?: Types.ObjectId;
  slug?: { $ne: string };
  $or?: SearchCondition[];
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listProducts(options: ListProductsOptions = {}) {
  const filter: ProductFilter = { is_active: true };

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

  if (options.excludeSlug) {
    filter.slug = { $ne: options.excludeSlug };
  }

  const search = options.search?.trim();
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
    ];
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
