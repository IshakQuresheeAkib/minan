"use client";

import { useEffect, useState } from "react";

import { fetchDashboardMetrics } from "@/features/admin/actions/dashboard.actions";
import type { DashboardMetrics } from "@/features/admin/types";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";

const emptyMetrics: DashboardMetrics = {
  leadsToday: 0,
  leadsThisMonth: 0,
  topProduct: null,
  topCategory: null,
  trafficSources: [],
};

export function useDashboard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardMetrics(token);
        if (!cancelled) {
          setMetrics(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Failed to load dashboard metrics.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { metrics, loading: accessToken ? loading : false, error };
}
