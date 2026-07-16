import type { CategoryDocument } from "../models/Category.js";
import type { SubcategoryDocument } from "../models/Subcategory.js";
import type { SubcategoryResponse } from "../types/admin.types.js";

function isPopulatedCategory(
  value: SubcategoryDocument["category_id"],
): value is CategoryDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "slug" in value
  );
}

export function serializeSubcategory(
  subcategory: SubcategoryDocument,
): SubcategoryResponse {
  const categoryId = subcategory.category_id;

  return {
    _id: subcategory._id.toString(),
    category_id: isPopulatedCategory(categoryId)
      ? categoryId._id.toString()
      : String(categoryId),
    category: isPopulatedCategory(categoryId)
      ? { name: categoryId.name, slug: categoryId.slug }
      : null,
    name: subcategory.name,
    slug: subcategory.slug,
    display_order: subcategory.display_order,
    is_active: subcategory.is_active,
    createdAt: subcategory.createdAt.toISOString(),
    updatedAt: subcategory.updatedAt.toISOString(),
  };
}
