"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Product } from "@/features/products/schemas/product.schema";
import {
  getProducts,
  type ProductSortOption,
} from "@/features/products/services/product.service";

const PAGE_SIZE = 20;

type InitialProductsData = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type UseProductsOptions = {
  category?: string | readonly string[];
  search?: string;
  colors?: readonly string[];
  sizes?: readonly string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSortOption;
  initialData?: InitialProductsData;
};

function normalizeValues(value: string | readonly string[] | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].sort();
}

function toKey(values: readonly string[]) {
  return values.join("\u001f");
}

function fromKey(key: string) {
  return key ? key.split("\u001f") : [];
}

export function useProducts(options: UseProductsOptions = {}) {
  const { initialData, maxPrice, minPrice, search, sort = "newest" } = options;
  const categoryKey = toKey(normalizeValues(options.category));
  const colorKey = toKey(normalizeValues(options.colors));
  const sizeKey = toKey(normalizeValues(options.sizes));
  const [products, setProducts] = useState<Product[]>(initialData?.data ?? []);
  const [page, setPage] = useState(initialData?.page ?? 0);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const hasConsumedInitialDataRef = useRef(false);
  const filtersKey = [
    categoryKey,
    colorKey,
    sizeKey,
    minPrice ?? "",
    maxPrice ?? "",
    sort,
    search ?? "",
  ].join("|");

  const fetchPage = useCallback(
    async (pageToFetch: number) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      const generation = fetchGenerationRef.current;
      const isFirstPage = pageToFetch === 1;

      if (isFirstPage) {
        setIsRefreshing(true);
        setError(null);
      }
      setIsLoading(true);

      try {
        const result = await getProducts({
          page: pageToFetch,
          limit: PAGE_SIZE,
          category: fromKey(categoryKey),
          colors: fromKey(colorKey),
          sizes: fromKey(sizeKey),
          minPrice,
          maxPrice,
          search,
          sort,
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setTotal(result.total);
        setPage(pageToFetch);
        setHasMore(result.hasMore);
        setProducts((current) =>
          pageToFetch === 1 ? result.data : [...current, ...result.data],
        );
      } catch (err) {
        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        if (generation !== fetchGenerationRef.current) {
          return;
        }

        loadingRef.current = false;
        if (isFirstPage) {
          setIsRefreshing(false);
        }
        setIsLoading(false);
      }
    },
    [categoryKey, colorKey, maxPrice, minPrice, search, sizeKey, sort],
  );

  const loadMore = useCallback(() => {
    if (loadingRef.current) {
      return;
    }

    if (page > 0 && !hasMore) {
      return;
    }

    void fetchPage(page === 0 ? 1 : page + 1);
  }, [fetchPage, hasMore, page]);

  useEffect(() => {
    fetchGenerationRef.current += 1;
    loadingRef.current = false;

    if (initialData && !hasConsumedInitialDataRef.current) {
      hasConsumedInitialDataRef.current = true;
      return;
    }

    async function refreshProducts() {
      setPage(0);
      setTotal(0);
      setHasMore(false);
      loadingRef.current = false;
      setIsRefreshing(true);
      setIsLoading(true);
      await fetchPage(1);
    }

    void refreshProducts();
  }, [fetchPage, filtersKey, initialData]);

  return {
    products,
    isLoading,
    isRefreshing,
    error,
    loadMore,
    hasMore,
    total,
  };
}
