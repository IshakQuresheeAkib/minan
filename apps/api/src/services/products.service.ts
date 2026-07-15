import type { Types } from "mongoose";

import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Subcategory } from "../models/Subcategory.js";
import type { ProductFilterOptionsResponse } from "../types/product.types.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export type ProductSortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type ListProductsOptions = {
  categorySlugs?: string[];
  subcategorySlugs?: string[];
  search?: string;
  page?: number;
  limit?: number;
  excludeSlug?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
};

type SearchCondition = {
  name?: { $regex: string; $options: "i" };
  description?: { $regex: string; $options: "i" };
  slug?: { $regex: string; $options: "i" };
};

type ProductFilter = {
  is_active: boolean;
  category_id?: Types.ObjectId | { $in: Types.ObjectId[] };
  subcategory_id?: Types.ObjectId | { $in: Types.ObjectId[] };
  slug?: { $ne: string };
  colors?: { $in: string[] };
  sizes?: { $in: string[] };
  price?: {
    $gte?: number;
    $lte?: number;
  };
  $or?: SearchCondition[];
};

type ProductSort = {
  createdAt?: 1 | -1;
  price?: 1 | -1;
  name?: 1 | -1;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSort(sort: ProductSortOption | undefined): ProductSort {
  if (sort === "price-asc") {
    return { price: 1 };
  }

  if (sort === "price-desc") {
    return { price: -1 };
  }

  if (sort === "name-asc") {
    return { name: 1 };
  }

  return { createdAt: -1 };
}

export async function listProducts(options: ListProductsOptions = {}) {
  const filter: ProductFilter = { is_active: true };
  let selectedCategoryIds: Types.ObjectId[] | undefined;

  if (options.categorySlugs && options.categorySlugs.length > 0) {
    const categories = await Category.find({
      slug: { $in: options.categorySlugs },
      is_active: true,
    }).select("_id");

    if (categories.length === 0) {
      const page = Math.max(1, options.page ?? 1);
      const limit = Math.max(0, options.limit ?? 0);

      return { data: [], total: 0, page, limit, hasMore: false };
    }

    selectedCategoryIds = categories.map((category) => category._id);
    filter.category_id = { $in: selectedCategoryIds };
  }

  if (
    selectedCategoryIds &&
    options.subcategorySlugs &&
    options.subcategorySlugs.length > 0
  ) {
    const subcategories = await Subcategory.find({
      slug: { $in: options.subcategorySlugs },
      category_id: { $in: selectedCategoryIds },
      is_active: true,
    }).select("_id");

    const requestedSubcategoryCount = new Set(
      options.subcategorySlugs,
    ).size;
    if (subcategories.length !== requestedSubcategoryCount) {
      const page = Math.max(1, options.page ?? 1);
      const limit = Math.max(0, options.limit ?? 0);

      return { data: [], total: 0, page, limit, hasMore: false };
    }

    filter.subcategory_id = {
      $in: subcategories.map((subcategory) => subcategory._id),
    };
  }

  if (options.excludeSlug) {
    filter.slug = { $ne: options.excludeSlug };
  }

  if (options.colors && options.colors.length > 0) {
    filter.colors = { $in: options.colors };
  }

  if (options.sizes && options.sizes.length > 0) {
    filter.sizes = { $in: options.sizes };
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    filter.price = {};

    if (options.minPrice !== undefined) {
      filter.price.$gte = options.minPrice;
    }

    if (options.maxPrice !== undefined) {
      filter.price.$lte = options.maxPrice;
    }
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
    .populate(["category_id", "subcategory_id"])
    .sort(getSort(options.sort));

  const page = Math.max(1, options.page ?? 1);
  if (options.limit !== undefined && options.limit >= 1) {
    query = query.skip((page - 1) * options.limit).limit(options.limit);
  }

  const [products, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  const limit = options.limit ?? total;

  return {
    data: products.map(serializeProduct),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export async function getProductBySlug(slug: string) {
  return Product.findOne({ slug, is_active: true }).populate([
    "category_id",
    "subcategory_id",
  ]);
}

export async function getProductFilterOptions(): Promise<ProductFilterOptionsResponse> {
  const [categories, referencedSubcategoryIds, colors, sizes, priceRange] =
    await Promise.all([
    Category.find({ is_active: true }).sort({ name: 1 }).select("name slug"),
    Product.distinct("subcategory_id", {
      is_active: true,
      subcategory_id: { $ne: null },
    }),
    Product.distinct("colors", { is_active: true }),
    Product.distinct("sizes", { is_active: true }),
    Product.aggregate<{ min: number; max: number }>([
      { $match: { is_active: true } },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" },
        },
      },
    ]),
  ]);

  const subcategories = await Subcategory.find({
    _id: { $in: referencedSubcategoryIds },
    category_id: { $in: categories.map((category) => category._id) },
    is_active: true,
  })
    .sort({ display_order: 1, name: 1 })
    .select("category_id name slug");
  const subcategoriesByCategoryId = new Map<
    string,
    { name: string; slug: string }[]
  >();

  subcategories.forEach((subcategory) => {
    const categoryId = String(subcategory.category_id);
    const current = subcategoriesByCategoryId.get(categoryId) ?? [];
    current.push({ name: subcategory.name, slug: subcategory.slug });
    subcategoriesByCategoryId.set(categoryId, current);
  });

  const price = priceRange[0] ?? { min: 0, max: 0 };

  return {
    data: {
      categories: categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        subcategories:
          subcategoriesByCategoryId.get(category._id.toString()) ?? [],
      })),
      colors: colors.sort((first, second) => first.localeCompare(second)),
      sizes: sizes.sort((first, second) => first.localeCompare(second)),
      price: {
        min: price.min,
        max: price.max,
      },
    },
  };
}
