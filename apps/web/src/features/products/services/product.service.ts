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
  featured?: boolean;
  category?: string;
};

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<ApiList<Product>> {
  const params = new URLSearchParams();

  if (options.featured) {
    params.set("featured", "true");
  }

  if (options.category) {
    params.set("category", options.category);
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
