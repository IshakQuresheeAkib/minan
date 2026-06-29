import { apiRequest } from "@/lib/api/client";
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

  const query = params.toString();
  const path = query ? `/api/products?${query}` : "/api/products";

  const response = await apiRequest<ApiList<Product>>(path);
  return productListSchema.parse(response);
}

const colorClassMap: Record<string, ProductCardData["colors"][number]> = {
  Black: "bg-foreground",
  White: "bg-secondary",
  Red: "bg-chart-2",
  Gold: "bg-chart-5",
  Blue: "bg-primary",
  Navy: "bg-primary",
  Beige: "bg-accent",
  Brown: "bg-chart-5",
  Maroon: "bg-chart-2",
  "Sky Blue": "bg-primary",
};

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
