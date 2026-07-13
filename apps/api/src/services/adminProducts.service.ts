import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { throwIfDuplicateKey } from "../lib/mongoErrors.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { slugify } from "../lib/slugify.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/admin.schemas.js";
import type { ProductListResponse } from "../types/product.types.js";
import { serializeProduct } from "../utils/serializeProduct.js";

export type AdminProductStatusFilter = "all" | "active" | "inactive";

type AdminProductFilterOptions = {
  search?: string;
  categoryId?: string;
  status?: AdminProductStatusFilter;
};

type SearchCondition = {
  name?: { $regex: string; $options: "i" };
  description?: { $regex: string; $options: "i" };
  slug?: { $regex: string; $options: "i" };
};

type ProductFilter = {
  is_active?: boolean;
  category_id?: Types.ObjectId;
  $or?: SearchCondition[];
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
}

async function resolveUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const filter: { slug: string; _id?: { $ne: Types.ObjectId } } = {
      slug: candidate,
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existing = await Product.findOne(filter).select("_id");
    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listAdminProducts(options: {
  page: number;
  limit: number;
  skip: number;
  filters?: AdminProductFilterOptions;
}): Promise<ProductListResponse & { page: number; limit: number }> {
  const filter: ProductFilter = {};
  const status = options.filters?.status ?? "all";

  if (status === "active") {
    filter.is_active = true;
  }

  if (status === "inactive") {
    filter.is_active = false;
  }

  const search = options.filters?.search?.trim();
  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const categoryId = options.filters?.categoryId;
  if (categoryId) {
    const category = await Category.findById(categoryId).select("_id");

    if (!category) {
      return {
        data: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        hasMore: false,
      };
    }

    filter.category_id = category._id;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category_id")
      .sort({ createdAt: -1 })
      .skip(options.skip)
      .limit(options.limit),
    Product.countDocuments(filter),
  ]);

  return {
    data: products.map(serializeProduct),
    total,
    page: options.page,
    limit: options.limit,
    hasMore: options.page * options.limit < total,
  };
}

export async function createAdminProduct(input: ProductCreateInput) {
  await ensureCategoryExists(input.category_id);

  const baseSlug = slugify(input.slug ?? input.name);
  if (!baseSlug) {
    throw new AppError("Unable to generate slug from name", 400);
  }

  const slug = await resolveUniqueSlug(baseSlug);

  try {
    const product = await Product.create({
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      category_id: input.category_id,
      sizes: input.sizes,
      colors: input.colors,
      images: input.images,
      is_active: true,
    });

    await product.populate("category_id");
    const serializedProduct = serializeProduct(product);
    await revalidateStorefront();
    return serializedProduct;
  } catch (error) {
    throwIfDuplicateKey(error, "Product slug already exists");
  }
}

export async function updateAdminProduct(
  id: string,
  input: ProductUpdateInput,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (input.category_id) {
    await ensureCategoryExists(input.category_id);
    product.category_id = new Types.ObjectId(input.category_id);
  }

  if (input.name !== undefined) {
    product.name = input.name;
  }

  if (input.slug !== undefined) {
    const baseSlug = slugify(input.slug);
    if (!baseSlug) {
      throw new AppError("Slug normalizes to an empty string", 400);
    }
    product.slug = await resolveUniqueSlug(baseSlug, id);
  }

  if (input.description !== undefined) {
    product.description = input.description;
  }

  if (input.price !== undefined) {
    product.price = input.price;
  }

  if (input.sizes !== undefined) {
    product.sizes = input.sizes;
  }

  if (input.colors !== undefined) {
    product.colors = input.colors;
  }

  if (input.images !== undefined) {
    product.images = input.images;
  }

  if (input.is_active !== undefined) {
    product.is_active = input.is_active;
  }

  try {
    await product.save();
    await product.populate("category_id");
    const serializedProduct = serializeProduct(product);
    await revalidateStorefront();
    return serializedProduct;
  } catch (error) {
    throwIfDuplicateKey(error, "Product slug already exists");
  }
}

export async function deactivateAdminProduct(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid product id", 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.is_active = false;
  await product.save();
  await product.populate("category_id");
  const serializedProduct = serializeProduct(product);
  await revalidateStorefront();
  return serializedProduct;
}
