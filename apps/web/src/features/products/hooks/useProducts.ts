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
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageToFetch: number) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const result = await getProducts({
          page: pageToFetch,
          limit: PAGE_SIZE,
          category,
        });

        setTotal(result.total);
        setPage(pageToFetch);
        setProducts((current) =>
          pageToFetch === 1 ? result.data : [...current, ...result.data],
        );
      } finally {
        loadingRef.current = false;
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
    setProducts([]);
    setPage(0);
    setTotal(0);
    void fetchPage(1);
  }, [fetchPage]);

  return {
    products,
    isLoading,
    loadMore,
    hasMore: products.length < total,
    total,
  };
}
