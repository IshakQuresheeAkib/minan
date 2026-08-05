import type { AdminOrder, PaginatedResponse } from "@/features/admin/types";
import { apiDownload, apiRequest } from "@/lib/api/client";

export async function fetchAdminOrders(accessToken: string, params: URLSearchParams): Promise<PaginatedResponse<AdminOrder>> {
  return apiRequest(`/api/admin/orders?${params.toString()}`, { accessToken });
}

export async function fetchAdminOrder(accessToken: string, id: string): Promise<{ data: AdminOrder }> {
  return apiRequest(`/api/admin/orders/${encodeURIComponent(id)}`, { accessToken });
}

export async function mutateAdminOrder(
  accessToken: string,
  id: string,
  endpoint: string,
  method: "PATCH" | "POST",
  body: Record<string, unknown>,
): Promise<{ data: AdminOrder }> {
  return apiRequest(`/api/admin/orders/${encodeURIComponent(id)}/${endpoint}`, { accessToken, method, body });
}

export async function fetchOrderChanges(accessToken: string, cursor?: string): Promise<{ data: AdminOrder[]; cursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  return apiRequest(`/api/admin/orders/changes?${params.toString()}`, { accessToken });
}

export async function recheckAdminOrderPayment(accessToken: string, id: string): Promise<{ data: AdminOrder }> {
  return apiRequest(`/api/admin/orders/${encodeURIComponent(id)}/payments/recheck`, { method: "POST", accessToken });
}

export async function downloadAdminOrdersCsv(accessToken: string, params: URLSearchParams): Promise<void> {
  const exportParams = new URLSearchParams(params);
  exportParams.delete("page");
  exportParams.delete("limit");
  const blob = await apiDownload(`/api/admin/orders/export?${exportParams.toString()}`, accessToken);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `minan-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
