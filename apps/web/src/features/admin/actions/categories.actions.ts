import { apiRequest } from "@/lib/api/client";
import type { AdminCategory } from "@/features/admin/types";
import { sortCategories } from "@/lib/catalog/category-order";

type CategoryListResponse = {
  data: AdminCategory[];
  total: number;
};

export async function fetchAdminCategories(
  accessToken: string,
): Promise<CategoryListResponse> {
  const response = await apiRequest<CategoryListResponse>(
    "/api/admin/categories",
    {
      accessToken,
    },
  );

  return {
    ...response,
    data: sortCategories(response.data),
  };
}

export async function createAdminCategory(
  accessToken: string,
  body: { name: string; slug?: string; image_url: string },
): Promise<{ data: AdminCategory }> {
  return apiRequest<{ data: AdminCategory }>("/api/admin/categories", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateAdminCategory(
  accessToken: string,
  id: string,
  body: Partial<{
    name: string;
    slug: string;
    image_url: string;
    is_active: boolean;
  }>,
): Promise<{ data: AdminCategory }> {
  return apiRequest<{ data: AdminCategory }>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function deactivateAdminCategory(
  accessToken: string,
  id: string,
): Promise<{ data: AdminCategory }> {
  return apiRequest<{ data: AdminCategory }>(
    `/api/admin/categories/${id}/deactivate`,
    {
      method: "PATCH",
      accessToken,
    },
  );
}
