import { apiRequest } from "@/lib/api/client";
import type { AdminUser } from "@/features/admin/types";

type AdminListResponse = {
  data: AdminUser[];
  total: number;
};

export async function fetchAdminUsers(
  accessToken: string,
): Promise<AdminListResponse> {
  return apiRequest<AdminListResponse>("/api/admin/admins", { accessToken });
}

export async function createAdminUser(
  accessToken: string,
  body: {
    email: string;
    password: string;
    role: "general" | "premium";
  },
): Promise<{ data: AdminUser }> {
  return apiRequest<{ data: AdminUser }>("/api/admin/admins", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateAdminUser(
  accessToken: string,
  id: string,
  body: Partial<{
    email: string;
    role: "general" | "premium";
    is_active: boolean;
  }>,
): Promise<{ data: AdminUser }> {
  return apiRequest<{ data: AdminUser }>(`/api/admin/admins/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function deactivateAdminUser(
  accessToken: string,
  id: string,
): Promise<{ data: AdminUser }> {
  return apiRequest<{ data: AdminUser }>(`/api/admin/admins/${id}/deactivate`, {
    method: "PATCH",
    accessToken,
  });
}
