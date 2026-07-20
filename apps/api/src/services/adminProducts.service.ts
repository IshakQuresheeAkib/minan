import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { throwIfDuplicateKey } from "../lib/mongoErrors.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { slugify } from "../lib/slugify.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Subcategory } from "../models/Subcategory.js";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/admin.schemas.js";
import type { ProductListResponse } from "../types/product.types.js";
import { serializeProduct } from "../utils/serializeProduct.js";
import { cleanupRemovedManagedImages } from "./adminMediaCleanup.service.js";

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

function parseObjectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label} id`, 400);
  }

  return new Types.ObjectId(value);
}

function getReferenceId(
  value: Types.ObjectId | { _id: unknown },
): Types.ObjectId {
  if (typeof value === "object" && value !== null && "_id" in value) {
    return new Types.ObjectId(String(value._id));
  }

  return new Types.ObjectId(String(value));
}

async function validateProductClassification(
  categoryId: Types.ObjectId,
  subcategoryId: Types.ObjectId | null,
): Promise<void> {
  const [category, activeSubcategoryCount, selectedSubcategory] =
    await Promise.all([
      Category.findById(categoryId).select("_id"),
      Subcategory.countDocuments({
        category_id: categoryId,
        is_active: true,
      }),
      subcategoryId
        ? Subcategory.findOne({
            _id: subcategoryId,
            category_id: categoryId,
            is_active: true,
          }).select("_id")
        : Promise.resolve(null),
    ]);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (subcategoryId && !selectedSubcategory) {
    throw new AppError(
      "Select an active subcategory that belongs to the selected category",
      400,
    );
  }

  if (activeSubcategoryCount > 0 && !subcategoryId) {
    throw new AppError("Subcategory is required for this category", 400);
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
      .populate(["category_id", "subcategory_id"])
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
  const categoryId = parseObjectId(input.category_id, "category");
  const subcategoryId = input.subcategory_id
    ? parseObjectId(input.subcategory_id, "subcategory")
    : null;
  await validateProductClassification(categoryId, subcategoryId);

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
      discount: input.discount,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      sizes: input.sizes,
      colors: input.colors,
      images: input.images,
      is_active: true,
    });

    await product.populate(["category_id", "subcategory_id"]);
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

  const previousImages = [...product.images];
  const currentCategoryId = getReferenceId(product.category_id);
  const categoryId = input.category_id
    ? parseObjectId(input.category_id, "category")
    : currentCategoryId;
  const categoryChanged = !categoryId.equals(currentCategoryId);
  let subcategoryId = product.subcategory_id
    ? getReferenceId(product.subcategory_id)
    : null;

  if (input.subcategory_id !== undefined) {
    subcategoryId = input.subcategory_id
      ? parseObjectId(input.subcategory_id, "subcategory")
      : null;
  } else if (categoryChanged) {
    subcategoryId = null;
  }

  const isOnlyDeactivation =
    input.is_active === false && Object.keys(input).length === 1;
  if (!isOnlyDeactivation) {
    await validateProductClassification(categoryId, subcategoryId);
  }

  if (input.category_id !== undefined) {
    product.category_id = categoryId;
  }

  if (input.subcategory_id !== undefined || categoryChanged) {
    product.subcategory_id = subcategoryId;
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

  if (input.discount !== undefined) {
    product.discount = input.discount;
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
    await product.populate(["category_id", "subcategory_id"]);
    const serializedProduct = serializeProduct(product);
    await revalidateStorefront();
    await cleanupRemovedManagedImages({
      previousUrls: previousImages,
      nextUrls: product.images,
    });
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
  await product.populate(["category_id", "subcategory_id"]);
  const serializedProduct = serializeProduct(product);
  await revalidateStorefront();
  return serializedProduct;
}
