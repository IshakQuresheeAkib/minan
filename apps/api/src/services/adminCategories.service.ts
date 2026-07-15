import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { throwIfDuplicateKey } from "../lib/mongoErrors.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { slugify } from "../lib/slugify.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "../schemas/admin.schemas.js";
import type { CategoryListResponse } from "../types/admin.types.js";
import { serializeCategory } from "../utils/serializeCategory.js";
import { cleanupRemovedManagedImages } from "./adminMediaCleanup.service.js";

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

    const existing = await Category.findOne(filter).select("_id");
    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listAdminCategories(): Promise<CategoryListResponse> {
  const [categories, total] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Category.countDocuments(),
  ]);

  return {
    data: categories.map(serializeCategory),
    total,
    page: 1,
    limit: total,
  };
}

export async function createAdminCategory(input: CategoryCreateInput) {
  const baseSlug = slugify(input.slug ?? input.name);
  if (!baseSlug) {
    throw new AppError("Unable to generate slug from name", 400);
  }

  const slug = await resolveUniqueSlug(baseSlug);

  try {
    const category = await Category.create({
      name: input.name,
      slug,
      image_url: input.image_url,
      is_active: true,
    });

    const serializedCategory = serializeCategory(category);
    await revalidateStorefront();
    return serializedCategory;
  } catch (error) {
    throwIfDuplicateKey(error, "Category slug already exists");
  }
}

export async function updateAdminCategory(
  id: string,
  input: CategoryUpdateInput,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const previousImageUrl = category.image_url;

  if (input.name !== undefined) {
    category.name = input.name;
  }

  if (input.slug !== undefined) {
    const baseSlug = slugify(input.slug);
    if (!baseSlug) {
      throw new AppError("Slug normalizes to an empty string", 400);
    }
    category.slug = await resolveUniqueSlug(baseSlug, id);
  }

  if (input.image_url !== undefined) {
    category.image_url = input.image_url;
  }

  if (input.is_active !== undefined) {
    category.is_active = input.is_active;
  }

  try {
    await category.save();
    const serializedCategory = serializeCategory(category);
    await revalidateStorefront();
    await cleanupRemovedManagedImages({
      previousUrls: [previousImageUrl],
      nextUrls: [category.image_url],
      categoryId: id,
    });
    return serializedCategory;
  } catch (error) {
    throwIfDuplicateKey(error, "Category slug already exists");
  }
}

export async function deactivateAdminCategory(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const activeProductCount = await Product.countDocuments({
    category_id: category._id,
    is_active: true,
  });

  if (activeProductCount > 0) {
    throw new AppError(
      "Cannot deactivate category while active products reference it",
      409,
    );
  }

  category.is_active = false;
  await category.save();
  const serializedCategory = serializeCategory(category);
  await revalidateStorefront();
  return serializedCategory;
}
