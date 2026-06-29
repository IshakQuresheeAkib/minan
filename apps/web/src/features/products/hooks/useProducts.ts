"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Product } from "@/features/products/schemas/product.schema";
import { getProducts } from "@/features/products/services/product.service";

const PAGE_SIZE = 20;

type UseProductsOptions = {
  category?: string;
};

export function useProducts(options: UseProductsOptions = {}) {
  const { category } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const fetchGenerationRef = useRef(0);

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
          category,
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setTotal(result.total);
        setPage(pageToFetch);
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
    [category],
  );

  const loadMore = useCallback(() => {
    if (loadingRef.current) {
      return;
    }

    if (page > 0 && products.length >= total) {
      return;
    }

    void fetchPage(page === 0 ? 1 : page + 1);
  }, [fetchPage, page, products.length, total]);

  useEffect(() => {
    fetchGenerationRef.current += 1;

    async function refreshProducts() {
      setPage(0);
      setTotal(0);
      loadingRef.current = false;
      setIsRefreshing(true);
      setIsLoading(true);
      await fetchPage(1);
    }

    void refreshProducts();
  }, [fetchPage]);

  return {
    products,
    isLoading,
    isRefreshing,
    error,
    loadMore,
    hasMore: products.length < total,
    total,
  };
}
