import { apiRequest } from "@/lib/api/client";
import type {
  AdminLead,
  LeadStatus,
  PaginatedResponse,
} from "@/features/admin/types";

export async function fetchAdminLeads(
  accessToken: string,
  page = 1,
): Promise<PaginatedResponse<AdminLead>> {
  return apiRequest<PaginatedResponse<AdminLead>>(
    `/api/admin/leads?page=${page}&limit=20`,
    { accessToken },
  );
}

export async function fetchAdminLead(
  accessToken: string,
  id: string,
): Promise<{ data: AdminLead }> {
  return apiRequest<{ data: AdminLead }>(`/api/admin/leads/${id}`, {
    accessToken,
  });
}

export async function updateAdminLead(
  accessToken: string,
  id: string,
  body: { status?: LeadStatus; notes?: string },
): Promise<{ data: AdminLead }> {
  return apiRequest<{ data: AdminLead }>(`/api/admin/leads/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}
