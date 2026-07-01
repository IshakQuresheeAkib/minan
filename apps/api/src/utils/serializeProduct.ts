import type { CategoryDocument } from "../models/Category.js";
import type { ProductDocument } from "../models/Product.js";
import type {
  ProductCategorySummary,
  ProductResponse,
} from "../types/product.types.js";

function isPopulatedCategory(
  value: ProductDocument["category_id"],
): value is CategoryDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "slug" in value
  );
}

function getCategoryId(product: ProductDocument): string {
  const { category_id: categoryId } = product;

  if (isPopulatedCategory(categoryId)) {
    return categoryId._id.toString();
  }

  return String(categoryId);
}

function getCategorySummary(
  product: ProductDocument,
): ProductCategorySummary | null {
  const { category_id: categoryId } = product;

  if (!isPopulatedCategory(categoryId)) {
    return null;
  }

  return {
    name: categoryId.name,
    slug: categoryId.slug,
  };
}

export function serializeProduct(product: ProductDocument): ProductResponse {
  return {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    category_id: getCategoryId(product),
    category: getCategorySummary(product),
    sizes: product.sizes,
    colors: product.colors,
    images: product.images,
    is_active: product.is_active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
