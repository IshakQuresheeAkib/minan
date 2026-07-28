import type { Metadata } from "next";
import { connection } from "next/server";

import {
  ProductCatalog,
  type ProductCatalogFilters,
} from "@/features/products/components/ProductCatalog";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import { type ProductSortOption } from "@/features/products/services/product.service";

type ProductSearchParams = {
  category?: string | string[];
  subcategory?: string | string[];
  color?: string | string[];
  size?: string | string[];
  search?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
};

type ProductsPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

function hasFilters(params: ProductSearchParams): boolean {
  return Object.values(params).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value),
  );
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const filtered = hasFilters(await searchParams);
  const title = "Products";
  const description =
    "Browse premium daily wear from the current MINAN collection.";

  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: {
      title,
      description,
      url: "/products",
    },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

function getFirstParam(value: string | string[] | undefined): string | undefined {
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

  return {
    minPrice,
    maxPrice,
  };
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await connection();

  const params = await searchParams;
  const categories = getParamValues(params.category);
  const subcategories =
    categories.length > 0 ? getParamValues(params.subcategory) : [];
  const colors = getParamValues(params.color);
  const sizes = getParamValues(params.size);
  const search = getFirstParam(params.search)?.trim();
  const { minPrice, maxPrice } = normalizePriceRange(
    getNumberParam(params.minPrice),
    getNumberParam(params.maxPrice),
  );
  const sort = getSortParam(params.sort);
  const filters: ProductCatalogFilters = {
    categories,
    subcategories,
    colors,
    sizes,
    search,
    minPrice,
    maxPrice,
    sort,
  };
  const [products, filterOptions] = await Promise.all([
    getCachedProducts({
      category: filters.categories,
      subcategories: filters.subcategories,
      colors: filters.colors,
      sizes: filters.sizes,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      page: 1,
      limit: 20,
    }),
    getCachedProductFilterOptions(),
  ]);

  return (
    <section className="mx-auto w-full max-w-11/12 py-10 2xl:px-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          {search ? `Search results for "${search}"` : "Products"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground/70">
          {search
            ? "Browse matching pieces from the current MINAN collection."
            : "Premium daily wear selected for fast browsing and easy ordering."}
        </p>
      </div>
      <ProductCatalog
        filters={filters}
        filterOptions={filterOptions}
        initialData={products}
      />
    </section>
  );
}
