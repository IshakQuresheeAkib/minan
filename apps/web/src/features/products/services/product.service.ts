import { ApiError, apiRequest } from "@/lib/api/client";
import type { ApiList } from "@/types/api.types";
import {
  productSchema,
  type Product,
} from "@/features/products/schemas/product.schema";
import type { ProductCardData } from "@/features/products/components/ProductCard";
import { getProductColorSwatch } from "@/features/products/constants/product-colors";
import { z } from "zod";

const productListSchema = z.object({
  data: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

const productFilterOptionsSchema = z.object({
  data: z.object({
    categories: z.array(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        subcategories: z.array(
          z.object({
            name: z.string().min(1),
            slug: z.string().min(1),
          }),
        ),
      }),
    ),
    colors: z.array(z.string()),
    sizes: z.array(z.string()),
    price: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),
});

export type ProductSortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type ProductFilterOptions = z.infer<
  typeof productFilterOptionsSchema
>["data"];

export type GetProductsOptions = {
  category?: string | readonly string[];
  subcategories?: readonly string[];
  search?: string;
  page?: number;
  limit?: number;
  exclude?: string;
  colors?: readonly string[];
  sizes?: readonly string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
};

function appendValues(
  params: URLSearchParams,
  key: string,
  value: string | readonly string[] | undefined,
): void {
  if (!value) {
    return;
  }

  const values = Array.isArray(value) ? value : [value];

  values
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => params.append(key, item));
}

export async function getProducts(
  options: GetProductsOptions = {},
): Promise<ApiList<Product>> {
  const params = new URLSearchParams();

  appendValues(params, "category", options.category);
  appendValues(params, "subcategory", options.subcategories);

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

  appendValues(params, "color", options.colors);
  appendValues(params, "size", options.sizes);

  if (options.minPrice !== undefined) {
    params.set("minPrice", String(options.minPrice));
  }

  if (options.maxPrice !== undefined) {
    params.set("maxPrice", String(options.maxPrice));
  }

  if (options.sort) {
    params.set("sort", options.sort);
  }

  const query = params.toString();
  const path = query ? `/api/products?${query}` : "/api/products";

  const response = await apiRequest<ApiList<Product>>(path);
  return productListSchema.parse(response);
}

export async function getProductFilterOptions(): Promise<ProductFilterOptions> {
  const response = await apiRequest<z.infer<typeof productFilterOptionsSchema>>(
    "/api/products/filters",
  );
  return productFilterOptionsSchema.parse(response).data;
}

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
    imageUrl: product.images[0],
    colors: product.colors.map(getProductColorSwatch),
  };
}
