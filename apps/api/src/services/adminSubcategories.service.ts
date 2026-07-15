import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { throwIfDuplicateKey } from "../lib/mongoErrors.js";
import { revalidateStorefront } from "../lib/revalidateStorefront.js";
import { slugify } from "../lib/slugify.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Subcategory } from "../models/Subcategory.js";
import type {
  SubcategoryCreateInput,
  SubcategoryReorderInput,
  SubcategoryUpdateInput,
} from "../schemas/admin.schemas.js";
import type { SubcategoryListResponse } from "../types/admin.types.js";
import { serializeSubcategory } from "../utils/serializeSubcategory.js";

async function ensureCategoryExists(categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category id", 400);
  }

  const category = await Category.findById(categoryId).select("_id");
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
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

    const existing = await Subcategory.findOne(filter).select("_id");
    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getSubcategory(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid subcategory id", 400);
  }

  const subcategory = await Subcategory.findById(id);
  if (!subcategory) {
    throw new AppError("Subcategory not found", 404);
  }

  return subcategory;
}

export async function listAdminSubcategories(
  categoryId?: string,
): Promise<SubcategoryListResponse> {
  const filter: { category_id?: Types.ObjectId } = {};

  if (categoryId) {
    await ensureCategoryExists(categoryId);
    filter.category_id = new Types.ObjectId(categoryId);
  }

  const [subcategories, total] = await Promise.all([
    Subcategory.find(filter)
      .populate("category_id")
      .sort({ category_id: 1, display_order: 1, name: 1 }),
    Subcategory.countDocuments(filter),
  ]);

  return {
    data: subcategories.map(serializeSubcategory),
    total,
    page: 1,
    limit: total,
  };
}

export async function createAdminSubcategory(input: SubcategoryCreateInput) {
  const category = await ensureCategoryExists(input.category_id);
  const baseSlug = slugify(input.slug ?? input.name);
  if (!baseSlug) {
    throw new AppError("Unable to generate slug from name", 400);
  }

  const [slug, lastSubcategory] = await Promise.all([
    resolveUniqueSlug(baseSlug),
    Subcategory.findOne({ category_id: category._id })
      .sort({ display_order: -1 })
      .select("display_order"),
  ]);

  try {
    const subcategory = await Subcategory.create({
      category_id: category._id,
      name: input.name,
      slug,
      display_order: (lastSubcategory?.display_order ?? -1) + 1,
      is_active: true,
    });

    await subcategory.populate("category_id");
    const serializedSubcategory = serializeSubcategory(subcategory);
    await revalidateStorefront();
    return serializedSubcategory;
  } catch (error) {
    throwIfDuplicateKey(error, "Subcategory slug already exists");
  }
}

export async function updateAdminSubcategory(
  id: string,
  input: SubcategoryUpdateInput,
) {
  const subcategory = await getSubcategory(id);

  if (input.name !== undefined) {
    subcategory.name = input.name;
  }

  if (input.slug !== undefined) {
    const baseSlug = slugify(input.slug);
    if (!baseSlug) {
      throw new AppError("Slug normalizes to an empty string", 400);
    }
    subcategory.slug = await resolveUniqueSlug(baseSlug, id);
  }

  try {
    await subcategory.save();
    await subcategory.populate("category_id");
    const serializedSubcategory = serializeSubcategory(subcategory);
    await revalidateStorefront();
    return serializedSubcategory;
  } catch (error) {
    throwIfDuplicateKey(error, "Subcategory slug already exists");
  }
}

export async function deactivateAdminSubcategory(id: string) {
  const subcategory = await getSubcategory(id);
  const activeProductCount = await Product.countDocuments({
    subcategory_id: subcategory._id,
    is_active: true,
  });

  if (activeProductCount > 0) {
    throw new AppError(
      "Cannot deactivate subcategory while active products reference it",
      409,
    );
  }

  subcategory.is_active = false;
  await subcategory.save();
  await subcategory.populate("category_id");
  const serializedSubcategory = serializeSubcategory(subcategory);
  await revalidateStorefront();
  return serializedSubcategory;
}

export async function reactivateAdminSubcategory(id: string) {
  const subcategory = await getSubcategory(id);
  subcategory.is_active = true;
  await subcategory.save();
  await subcategory.populate("category_id");
  const serializedSubcategory = serializeSubcategory(subcategory);
  await revalidateStorefront();
  return serializedSubcategory;
}

export async function reorderAdminSubcategories(
  input: SubcategoryReorderInput,
) {
  const category = await ensureCategoryExists(input.category_id);
  const subcategories = await Subcategory.find({
    category_id: category._id,
  }).select("_id");
  const existingIds = new Set(
    subcategories.map((subcategory) => subcategory._id.toString()),
  );

  if (
    input.ordered_ids.length !== existingIds.size ||
    input.ordered_ids.some((id) => !existingIds.has(id))
  ) {
    throw new AppError(
      "ordered_ids must include every subcategory in the category exactly once",
      400,
    );
  }

  await Subcategory.bulkWrite(
    input.ordered_ids.map((id, displayOrder) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), category_id: category._id },
        update: { $set: { display_order: displayOrder } },
      },
    })),
  );

  await revalidateStorefront();
  return listAdminSubcategories(input.category_id);
}
