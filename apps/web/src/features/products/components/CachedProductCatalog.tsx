"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { ProductCatalogSkeleton } from "@/features/products/components/ProductCatalogSkeleton";
import { catalogQuery, type CachedPage } from "@/features/products/hooks/useProducts";
import { parseCatalogFilters } from "@/features/products/lib/catalog-filters";
import type { ProductFilterOptions } from "@/features/products/services/product.service";

// Route responses can be pending even when their browser data is already cached.
export function ProductCatalogPending({ categorySlug }: { categorySlug?: string }) {
  return <Suspense fallback={<ProductCatalogSkeleton />}><CachedProductCatalog categorySlug={categorySlug} /></Suspense>;
}

function CachedProductCatalog({ categorySlug }: { categorySlug?: string }) {
  const { cache } = useSWRConfig();
  const pathname = usePathname();
  const fixedCategorySlug = categorySlug ?? (pathname.startsWith("/collections/") ? pathname.split("/")[2] : undefined);
  const searchParams = useSearchParams();
  const query = Object.fromEntries(
    [...new Set(searchParams.keys())].map((key) => [key, searchParams.getAll(key)]),
  );
  const filters = parseCatalogFilters(query, fixedCategorySlug);
  const cacheKey = unstable_serialize(() => ["catalog-page", catalogQuery({
    category: filters.categories,
    subcategories: filters.subcategories,
    colors: filters.colors,
    sizes: filters.sizes,
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
  }), 1]);
  // Let the mounted catalog own this infinite key's revalidation callbacks.
  const pages = cache.get(cacheKey)?.data as CachedPage[] | undefined;
  const { data: filterOptions } = useSWR<ProductFilterOptions>("catalog-filter-options", null);
  if (!pages?.[0] || !filterOptions) return <ProductCatalogSkeleton />;
  return <ProductCatalog filters={filters} filterOptions={filterOptions} fixedCategorySlug={fixedCategorySlug} initialData={pages[0]} />;
}
