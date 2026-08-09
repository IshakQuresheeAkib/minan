import type { ProductSortOption } from "@/features/products/services/product.service";

export type ProductSearchParams = {
  category?: string | string[];
  subcategory?: string | string[];
  color?: string | string[];
  size?: string | string[];
  search?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
};

export type ProductCatalogFilters = {
  categories: string[];
  subcategories: string[];
  colors: string[];
  sizes: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSortOption;
};

export function hasCatalogQuery(params: ProductSearchParams): boolean {
  return Object.values(params).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value),
  );
}

export function parseCatalogFilters(
  params: ProductSearchParams,
  fixedCategorySlug?: string,
): ProductCatalogFilters {
  const categories = fixedCategorySlug
    ? [fixedCategorySlug]
    : getParamValues(params.category);
  const subcategories =
    categories.length > 0 ? getParamValues(params.subcategory) : [];
  const search = getFirstParam(params.search)?.trim();
  const { minPrice, maxPrice } = normalizePriceRange(
    getNumberParam(params.minPrice),
    getNumberParam(params.maxPrice),
  );

  return {
    categories,
    subcategories,
    colors: getParamValues(params.color),
    sizes: getParamValues(params.size),
    search: search || undefined,
    minPrice,
    maxPrice,
    sort: getSortParam(params.sort),
  };
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getParamValues(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      values
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function getNumberParam(value: string | string[] | undefined) {
  const param = getFirstParam(value)?.trim();
  if (!param) {
    return undefined;
  }

  const parsed = Number(param);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizePriceRange(
  minPrice: number | undefined,
  maxPrice: number | undefined,
) {
  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    return {
      minPrice: maxPrice,
      maxPrice: minPrice,
    };
  }

  return { minPrice, maxPrice };
}

function getSortParam(
  value: string | string[] | undefined,
): ProductSortOption {
  const sort = getFirstParam(value);

  if (
    sort === "price-asc" ||
    sort === "price-desc" ||
    sort === "name-asc"
  ) {
    return sort;
  }

  return "newest";
}
