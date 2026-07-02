import { apiRequest } from "@/lib/api/client";
import type {
  AdminProduct,
  PaginatedResponse,
  UploadSignature,
} from "@/features/admin/types";

export type AdminProductStatusFilter = "all" | "active" | "inactive";

type FetchAdminProductsOptions = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: AdminProductStatusFilter;
};

export async function fetchAdminProducts(
  accessToken: string,
  options: FetchAdminProductsOptions = {},
): Promise<PaginatedResponse<AdminProduct>> {
  const params = new URLSearchParams();
  const page = options.page ?? 1;

  params.set("page", String(page));

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  if (options.categoryId?.trim()) {
    params.set("category_id", options.categoryId.trim());
  }

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }

  return apiRequest<PaginatedResponse<AdminProduct>>(
    `/api/admin/products?${params.toString()}`,
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
