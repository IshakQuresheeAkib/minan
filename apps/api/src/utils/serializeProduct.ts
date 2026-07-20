import type { CategoryDocument } from "../models/Category.js";
import type { ProductDocument } from "../models/Product.js";
import type { SubcategoryDocument } from "../models/Subcategory.js";
import type {
  ProductCategorySummary,
  ProductResponse,
  ProductSubcategorySummary,
} from "../types/product.types.js";
import { calculateDiscountedPrice } from "./calculateDiscountedPrice.js";

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

function isPopulatedSubcategory(
  value: ProductDocument["subcategory_id"],
): value is SubcategoryDocument {
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

function getSubcategoryId(product: ProductDocument): string | null {
  const { subcategory_id: subcategoryId } = product;

  if (!subcategoryId) {
    return null;
  }

  if (isPopulatedSubcategory(subcategoryId)) {
    return subcategoryId._id.toString();
  }

  return String(subcategoryId);
}

function getSubcategorySummary(
  product: ProductDocument,
): ProductSubcategorySummary | null {
  const { subcategory_id: subcategoryId } = product;

  if (!isPopulatedSubcategory(subcategoryId)) {
    return null;
  }

  return {
    name: subcategoryId.name,
    slug: subcategoryId.slug,
  };
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
  const discount = product.discount ?? 0;

  return {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    discount,
    discounted_price: calculateDiscountedPrice(product.price, discount),
    category_id: getCategoryId(product),
    category: getCategorySummary(product),
    subcategory_id: getSubcategoryId(product),
    subcategory: getSubcategorySummary(product),
    sizes: product.sizes,
    colors: product.colors,
    images: product.images,
    is_active: product.is_active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
