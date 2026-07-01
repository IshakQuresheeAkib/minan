import { ApiError, apiRequest } from "@/lib/api/client";
import type { ApiList } from "@/types/api.types";
import {
  productSchema,
  type Product,
} from "@/features/products/schemas/product.schema";
import type { ProductCardData } from "@/features/products/components/ProductCard";
import { z } from "zod";

const productListSchema = z.object({
  data: z.array(productSchema),
  total: z.number(),
});

type GetProductsOptions = {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  exclude?: string;
};

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<ApiList<Product>> {
  const params = new URLSearchParams();

  if (options.category) {
    params.set("category", options.category);
  }

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.page !== undefined) {
    params.set("page", String(options.page));
  }

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  if (options.exclude) {
    params.set("exclude", options.exclude);
  }

  const query = params.toString();
  const path = query ? `/api/products?${query}` : "/api/products";

  const response = await apiRequest<ApiList<Product>>(path);
  return productListSchema.parse(response);
}

const colorClassMap: Record<string, ProductCardData["colors"][number]> = {
  Black: "bg-foreground",
  White: "bg-secondary",
  Blue: "bg-primary",
  Navy: "bg-primary",
  Beige: "bg-accent",
  "Sky Blue": "bg-primary",
};

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await apiRequest<{ data: Product }>(
      `/api/products/${encodeURIComponent(slug)}`,
    );
    return productSchema.parse(response.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  if (!product.category) {
    return [];
  }

  const { data } = await getProducts({
    category: product.category.slug,
    exclude: product.slug,
    limit,
  });

  return data;
}

export function mapProductToCard(product: Product): ProductCardData {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    colors: product.colors.map(
      (color) => colorClassMap[color] ?? "bg-muted-foreground",
    ),
  };
}
