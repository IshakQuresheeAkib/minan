import type { CategoryDocument } from "../models/Category.js";
import type { CategoryResponse } from "../types/admin.types.js";

export function serializeCategory(
  category: CategoryDocument,
): CategoryResponse {
  return {
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    image_url: category.image_url,
    is_active: category.is_active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
