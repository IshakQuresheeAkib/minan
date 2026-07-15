import { apiRequest } from "@/lib/api/client";
import type { AdminSubcategory } from "@/features/admin/types";

type SubcategoryListResponse = {
  data: AdminSubcategory[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchAdminSubcategories(
  accessToken: string,
  categoryId?: string,
): Promise<SubcategoryListResponse> {
  const params = new URLSearchParams();
  if (categoryId?.trim()) {
    params.set("category_id", categoryId.trim());
  }
  const query = params.toString();

  return apiRequest<SubcategoryListResponse>(
    query ? `/api/admin/subcategories?${query}` : "/api/admin/subcategories",
    { accessToken },
  );
}

export async function createAdminSubcategory(
  accessToken: string,
  body: { category_id: string; name: string; slug?: string },
): Promise<{ data: AdminSubcategory }> {
  return apiRequest<{ data: AdminSubcategory }>("/api/admin/subcategories", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateAdminSubcategory(
  accessToken: string,
  id: string,
  body: { name?: string; slug?: string },
): Promise<{ data: AdminSubcategory }> {
  return apiRequest<{ data: AdminSubcategory }>(
    `/api/admin/subcategories/${id}`,
    { method: "PATCH", accessToken, body },
  );
}

export async function deactivateAdminSubcategory(
  accessToken: string,
  id: string,
): Promise<{ data: AdminSubcategory }> {
  return apiRequest<{ data: AdminSubcategory }>(
    `/api/admin/subcategories/${id}/deactivate`,
    { method: "PATCH", accessToken },
  );
}

export async function reactivateAdminSubcategory(
  accessToken: string,
  id: string,
): Promise<{ data: AdminSubcategory }> {
  return apiRequest<{ data: AdminSubcategory }>(
    `/api/admin/subcategories/${id}/reactivate`,
    { method: "PATCH", accessToken },
  );
}

export async function reorderAdminSubcategories(
  accessToken: string,
  categoryId: string,
  orderedIds: string[],
): Promise<SubcategoryListResponse> {
  return apiRequest<SubcategoryListResponse>(
    "/api/admin/subcategories/reorder",
    {
      method: "PATCH",
      accessToken,
      body: { category_id: categoryId, ordered_ids: orderedIds },
    },
  );
}
