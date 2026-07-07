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
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [errorState, setErrorState] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [clientState, setClientState] = useState<{
    hasMore: boolean;
    key: string;
    page: number;
    products: Product[];
    total: number;
  }>({
    hasMore: initialData?.hasMore ?? false,
    key: "",
    page: initialData?.page ?? 0,
    products: [],
    total: initialData?.total ?? 0,
  });
  const loadingRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const filtersKey = [
    categoryKey,
    colorKey,
    sizeKey,
    minPrice ?? "",
    maxPrice ?? "",
    sort,
    search ?? "",
  ].join("|");
  const initialDataKey = initialData
    ? [
        filtersKey,
        initialData.page,
        initialData.limit,
        initialData.total,
        initialData.hasMore ? "1" : "0",
        initialData.data.map((product) => product._id).join("\u001f"),
      ].join("|")
    : "";
  const dataKey = initialData ? initialDataKey : filtersKey;
  const hasClientState = clientState.key === dataKey;
  const products = hasClientState
    ? clientState.products
    : (initialData?.data ?? []);
  const page = hasClientState ? clientState.page : (initialData?.page ?? 0);
  const total = hasClientState ? clientState.total : (initialData?.total ?? 0);
  const hasMore = hasClientState
    ? clientState.hasMore
    : (initialData?.hasMore ?? false);
  const error = errorState?.key === dataKey ? errorState.message : null;

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
        setErrorState(null);
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

        setClientState((current) => {
          const existingProducts =
            current.key === dataKey
              ? current.products
              : (initialData?.data ?? []);

          return {
            hasMore: result.hasMore,
            key: dataKey,
            page: pageToFetch,
            products:
              pageToFetch === 1
                ? result.data
                : [...existingProducts, ...result.data],
            total: result.total,
          };
        });
      } catch (err) {
        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setErrorState({
          key: dataKey,
          message:
            err instanceof Error ? err.message : "Failed to load products",
        });
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
    [
      categoryKey,
      colorKey,
      dataKey,
      initialData,
      maxPrice,
      minPrice,
      search,
      sizeKey,
      sort,
    ],
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

    if (initialData) return;

    async function refreshProducts() {
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
