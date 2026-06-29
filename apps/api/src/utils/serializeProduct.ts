import type { ProductDocument } from "../models/Product.js";
import type { ProductResponse } from "../types/product.types.js";

function getCategoryId(product: ProductDocument): string {
  const { category_id: categoryId } = product;

  if (
    typeof categoryId === "object" &&
    categoryId !== null &&
    "_id" in categoryId
  ) {
    return String((categoryId as { _id: { toString(): string } })._id);
  }

  return String(categoryId);
}

export function serializeProduct(product: ProductDocument): ProductResponse {
  return {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    category_id: getCategoryId(product),
    sizes: product.sizes,
    colors: product.colors,
    images: product.images,
    is_active: product.is_active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
