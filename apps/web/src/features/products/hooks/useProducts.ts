"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { unstable_serialize as serialize, useSWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";

import { getProducts, type CatalogProduct, type GetProductsOptions } from "@/features/products/services/product.service";

const PAGE_SIZE = 20;
const FRESH_TIME = 5 * 60 * 1000;

export type ProductsPage = {
  data: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
export type CachedPage = ProductsPage & { fetchedAt: number };
type PageKey = readonly ["catalog-page", GetProductsOptions, number];
type UseProductsOptions = Omit<GetProductsOptions, "page" | "limit" | "exclude"> & {
  initialData?: ProductsPage;
};

function normalizeValues(value: string | readonly string[] | undefined) {
  return [...new Set((typeof value === "string" ? [value] : value ?? [])
    .map((item) => item.trim()).filter(Boolean))].sort();
}

export function catalogQuery(filters: GetProductsOptions): GetProductsOptions {
  return {
    category: normalizeValues(filters.category),
    subcategories: normalizeValues(filters.subcategories),
    colors: normalizeValues(filters.colors),
    sizes: normalizeValues(filters.sizes),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort ?? "newest",
    search: filters.search?.trim() || undefined,
    limit: PAGE_SIZE,
  };
}

export function useProducts({ initialData, ...filters }: UseProductsOptions = {}) {
  const { cache, mutate: mutateCache } = useSWRConfig();
  const loadingMore = useRef(false);
  const filtersKey = JSON.stringify(catalogQuery(filters));
  const query = useMemo<GetProductsOptions>(() => JSON.parse(filtersKey), [filtersKey]);
  const getKey = useCallback((index: number, previous: CachedPage | null): PageKey | null => {
    if (previous && !previous.hasMore) return null;
    return ["catalog-page", query, index + 1];
  }, [query]);
  const { data, error, isValidating, size, setSize, mutate } = useSWRInfinite<CachedPage>(
    getKey,
    async ([, options, page]: PageKey) => ({
      ...await getProducts({ ...options, page, limit: PAGE_SIZE }),
      fetchedAt: Date.now(),
    }),
    {
      fallbackData: initialData ? [{ ...initialData, fetchedAt: 0 }] : undefined,
      revalidateOnMount: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    const cacheKey = unstable_serialize(getKey);
    const refreshIfStale = () => {
      const pages = cache.get(cacheKey)?.data as CachedPage[] | undefined;
      if (!pages?.[0] || Date.now() - pages[0].fetchedAt >= FRESH_TIME) {
        void mutate().catch(() => undefined);
      }
    };
    const pages = cache.get(cacheKey)?.data as CachedPage[] | undefined;
    if (!pages && initialData) {
      const firstPage = { ...initialData, fetchedAt: Date.now() };
      const firstKey = getKey(0, null);
      // Seed both caches so loading page two does not refetch page one.
      void mutateCache(serialize(firstKey), firstPage, { revalidate: false });
      void mutate([firstPage], { revalidate: false });
    } else {
      refreshIfStale();
    }
    window.addEventListener("focus", refreshIfStale);
    window.addEventListener("online", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      window.removeEventListener("online", refreshIfStale);
    };
  }, [cache, getKey, initialData, mutate, mutateCache]);

  const lastPage = data?.at(-1);
  const hasMore = lastPage?.hasMore ?? false;
  const loadMore = useCallback(() => {
    if (!hasMore || error || isValidating || loadingMore.current) return;
    loadingMore.current = true;
    void setSize(size + 1).catch(() => undefined).finally(() => {
      loadingMore.current = false;
    });
  }, [error, hasMore, isValidating, setSize, size]);
  const retry = useCallback(() => {
    if (!isValidating) void mutate().catch(() => undefined);
  }, [isValidating, mutate]);
  const products = [...new Map((data ?? []).flatMap((page) => page.data)
    .map((product) => [product._id, product])).values()];
  const paginating = isValidating && size > (data?.length ?? 0);

  return {
    products,
    isLoading: (!data && !error) || isValidating,
    isRefreshing: (!data && !error) || (isValidating && !paginating),
    error: error instanceof Error ? error.message : error ? "Failed to load products" : null,
    loadMore,
    retry,
    hasMore,
    total: data?.[0]?.total ?? 0,
  };
}
