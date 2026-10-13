"use client";

import useSWR from "swr";

import { fetchAdminOrder, fetchAdminOrders } from "@/features/admin/actions/orders.actions";
import { swrRetryWithBackoff } from "@/features/admin/lib/retryBackoff";
import type { AdminOrder, PaginatedResponse } from "@/features/admin/types";
import { useAuthStore } from "@/store/auth.store";

export function useAdminOrders(params: URLSearchParams) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = params.toString();
  const key = accessToken ? `admin-orders:${query}` : null;
  const result = useSWR<PaginatedResponse<AdminOrder>>(
    key,
    () => fetchAdminOrders(accessToken!, new URLSearchParams(query)),
    {
      keepPreviousData: true,
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      onErrorRetry: swrRetryWithBackoff,
    },
  );
  return { ...result, loading: Boolean(accessToken) && !result.data && !result.error };
}

export function useAdminOrder(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const key = accessToken && id ? `admin-order:${id}` : null;
  const result = useSWR<{ data: AdminOrder }>(
    key,
    () => fetchAdminOrder(accessToken!, id),
    { revalidateOnFocus: true, dedupingInterval: 3_000 },
  );
  return { ...result, order: result.data?.data, accessToken };
}
