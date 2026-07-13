import { cacheLife, cacheTag } from "next/cache";

import {
  getProductBySlug,
  getProductFilterOptions,
  getProducts,
  type GetProductsOptions,
} from "@/features/products/services/product.service";

const CATALOG_TAG = "catalog";

type NormalizedGetProductsOptions = Omit<
  GetProductsOptions,
  "category" | "colors" | "sizes"
> & {
  category?: readonly string[];
  colors?: readonly string[];
  sizes?: readonly string[];
};

function normalizeValues(
  value: string | readonly string[] | undefined,
): readonly string[] | undefined {
  if (!value) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = [
    ...new Set(values.map((item) => item.trim()).filter(Boolean)),
  ].sort((first, second) => first.localeCompare(second));

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeProductsOptions(
  options: GetProductsOptions,
): NormalizedGetProductsOptions {
  return {
    ...options,
    category: normalizeValues(options.category),
    colors: normalizeValues(options.colors),
    sizes: normalizeValues(options.sizes),
  };
}

async function getCachedProductsByNormalizedOptions(
  options: NormalizedGetProductsOptions,
) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("days");

  return getProducts(options);
}

export async function getCachedProducts(options: GetProductsOptions = {}) {
  return getCachedProductsByNormalizedOptions(
    normalizeProductsOptions(options),
  );
}

export async function getCachedProductBySlug(slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("days");

  return getProductBySlug(slug);
}

export async function getCachedProductFilterOptions() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("days");

  return getProductFilterOptions();
}
