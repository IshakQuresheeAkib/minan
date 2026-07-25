import { apiRequest } from "@/lib/api/client";
import type {
  AdminProduct,
  PaginatedResponse,
  UploadSignature,
} from "@/features/admin/types";

const UPLOAD_DELETE_BATCH_SIZE = 50;

export type AdminProductStatusFilter = "all" | "active" | "inactive";

export type AdminProductDeleteResponse = {
  data: {
    productId: string;
    mediaCleanup: {
      removed: number;
      retained: number;
      failed: number;
    };
  };
};

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
    description_html: string;
    price: number;
    discount: number;
    category_id: string;
    subcategory_id: string | null;
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
    description_html: string;
    price: number;
    discount: number;
    category_id: string;
    subcategory_id: string | null;
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

export async function deleteAdminProduct(
  accessToken: string,
  id: string,
): Promise<AdminProductDeleteResponse> {
  return apiRequest<AdminProductDeleteResponse>(
    `/api/admin/products/${id}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}

export async function fetchUploadSignature(
  accessToken: string,
  purpose?: "home-banner",
): Promise<UploadSignature> {
  const path = purpose
    ? `/api/admin/uploads/signature?purpose=${encodeURIComponent(purpose)}`
    : "/api/admin/uploads/signature";

  return apiRequest<UploadSignature>(path, {
    accessToken,
  });
}

export async function deleteUploadedImages(
  accessToken: string,
  publicIds: string[],
): Promise<void> {
  if (publicIds.length === 0) {
    return;
  }

  const uniquePublicIds = Array.from(new Set(publicIds));

  for (
    let batchStart = 0;
    batchStart < uniquePublicIds.length;
    batchStart += UPLOAD_DELETE_BATCH_SIZE
  ) {
    const publicIdBatch = uniquePublicIds.slice(
      batchStart,
      batchStart + UPLOAD_DELETE_BATCH_SIZE,
    );

    await apiRequest<{ data: { publicId: string; result: string }[] }>(
      "/api/admin/uploads/delete",
      {
        method: "POST",
        accessToken,
        body: {
          publicIds: publicIdBatch,
        },
      },
    );
  }
}
