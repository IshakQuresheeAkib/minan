import { apiRequest } from "@/lib/api/client";
import type {
  AdminProduct,
  PaginatedResponse,
  UploadSignature,
} from "@/features/admin/types";

export async function fetchAdminProducts(
  accessToken: string,
  page = 1,
): Promise<PaginatedResponse<AdminProduct>> {
  return apiRequest<PaginatedResponse<AdminProduct>>(
    `/api/admin/products?page=${page}&limit=20`,
    { accessToken },
  );
}

export async function createAdminProduct(
  accessToken: string,
  body: {
    name: string;
    slug?: string;
    description: string;
    price: number;
    category_id: string;
    sizes: string[];
    colors: string[];
    images: string[];
  },
): Promise<{ data: AdminProduct }> {
  return apiRequest<{ data: AdminProduct }>("/api/admin/products", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateAdminProduct(
  accessToken: string,
  id: string,
  body: Partial<{
    name: string;
    slug: string;
    description: string;
    price: number;
    category_id: string;
    sizes: string[];
    colors: string[];
    images: string[];
    is_active: boolean;
  }>,
): Promise<{ data: AdminProduct }> {
  return apiRequest<{ data: AdminProduct }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function deactivateAdminProduct(
  accessToken: string,
  id: string,
): Promise<{ data: AdminProduct }> {
  return apiRequest<{ data: AdminProduct }>(
    `/api/admin/products/${id}/deactivate`,
    {
      method: "PATCH",
      accessToken,
    },
  );
}

export async function fetchUploadSignature(
  accessToken: string,
): Promise<UploadSignature> {
  return apiRequest<UploadSignature>("/api/admin/uploads/signature", {
    accessToken,
  });
}
