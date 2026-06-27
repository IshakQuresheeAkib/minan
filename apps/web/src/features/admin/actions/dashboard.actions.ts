import { apiRequest } from "@/lib/api/client";
import type { DashboardMetrics } from "@/features/admin/types";

export async function fetchDashboardMetrics(
  accessToken: string,
): Promise<DashboardMetrics> {
  return apiRequest<DashboardMetrics>("/api/admin/dashboard", {
    accessToken,
  });
}
