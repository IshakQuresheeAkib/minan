"use client";

import useSWR from "swr";

import {
  fetchAdminProducts,
  type AdminProductStatusFilter,
} from "@/features/admin/actions/products.actions";
import { swrRetryWithBackoff } from "@/features/admin/lib/retryBackoff";
import type { AdminProduct, PaginatedResponse } from "@/features/admin/types";
import { useAuthStore } from "@/store/auth.store";

export type AdminProductFilters = {
  page: number;
  limit?: number;
  search: string;
  categoryId: string;
  status: AdminProductStatusFilter;
};

export function useAdminProducts(filters: AdminProductFilters) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const limit = filters.limit ?? 20;

  const serialized = JSON.stringify({
    page: filters.page,
    limit,
    search: filters.search.trim(),
    categoryId: filters.categoryId.trim(),
    status: filters.status,
  });

  const key = accessToken ? `admin-products:${serialized}` : null;

  const result = useSWR<PaginatedResponse<AdminProduct>>(
    key,
    () =>
      fetchAdminProducts(accessToken!, {
        page: filters.page,
        limit,
        search: filters.search.trim(),
        categoryId: filters.categoryId.trim(),
        status: filters.status,
      }),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 5_000,
      onErrorRetry: swrRetryWithBackoff,
    },
  );

  const total = result.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    ...result,
    products: result.data?.data ?? [],
    total,
    totalPages,
    loading: Boolean(accessToken) && !result.data && !result.error,
  };
}
