"use client";

import useSWR from "swr";

import { fetchDashboardMetrics } from "@/features/admin/actions/dashboard.actions";
import type { DashboardMetrics } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const emptyMetrics: DashboardMetrics = {
  ordersToday: 0,
  ordersThisMonth: 0,
  newOrders: 0,
  awaitingFee: 0,
  processing: 0,
  shipped: 0,
  returnsExceptions: 0,
  topProduct: null,
  topCategory: null,
  trafficSources: [],
};

export function useDashboard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const result = useSWR(
    accessToken ? ["admin-dashboard", accessToken] as const : null,
    ([, token]) => fetchDashboardMetrics(token),
    { revalidateOnFocus: true, dedupingInterval: 10_000 },
  );
  return {
    metrics: result.data ?? emptyMetrics,
    loading: Boolean(accessToken) && !result.data && !result.error,
    error: result.error instanceof ApiError ? result.error.message : result.error ? "Failed to load dashboard metrics." : null,
  };
}
