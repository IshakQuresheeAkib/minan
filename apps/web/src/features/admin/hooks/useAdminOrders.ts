"use client";

import useSWR from "swr";

import { fetchAdminOrder, fetchAdminOrders } from "@/features/admin/actions/orders.actions";
import type { AdminOrder, PaginatedResponse } from "@/features/admin/types";
import { useAuthStore } from "@/store/auth.store";

const RETRY_DELAYS = [30_000, 60_000, 120_000, 300_000] as const;

function retryWithBackoff(
  error: Error,
  key: string,
  config: { errorRetryCount?: number },
  revalidate: (options: { retryCount: number }) => void,
  options: { retryCount: number },
) {
  if (!navigator.onLine || document.visibilityState === "hidden") return;
  const index = Math.min(options.retryCount, RETRY_DELAYS.length - 1);
  const jitter = Math.floor(Math.random() * 5_000);
  window.setTimeout(() => revalidate({ retryCount: options.retryCount + 1 }), RETRY_DELAYS[index]! + jitter);
  void error;
  void key;
  void config;
}

export function useAdminOrders(params: URLSearchParams) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = params.toString();
  const key = accessToken ? `admin-orders:${query}:${accessToken}` : null;
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
      onErrorRetry: retryWithBackoff,
    },
  );
  return { ...result, loading: Boolean(accessToken) && !result.data && !result.error };
}

export function useAdminOrder(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const result = useSWR<{ data: AdminOrder }>(
    accessToken && id ? `admin-order:${id}:${accessToken}` : null,
    () => fetchAdminOrder(accessToken!, id),
    { revalidateOnFocus: true, dedupingInterval: 3_000 },
  );
  return { ...result, order: result.data?.data, accessToken };
}
