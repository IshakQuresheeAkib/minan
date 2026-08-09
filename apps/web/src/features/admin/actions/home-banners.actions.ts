import type { AdminHomeBannerSet } from "@/features/admin/types";
import { apiRequest } from "@/lib/api/client";

type BannerSetResponse = {
  data: AdminHomeBannerSet;
};

export async function fetchAdminHomeBanners(accessToken: string) {
  return apiRequest<BannerSetResponse>("/api/admin/home-banners", {
    accessToken,
  });
}

export async function createAdminHomeBanner(
  accessToken: string,
  body: {
    alt_text: string;
    desktop_image_url: string;
    mobile_image_url: string;
    expected_revision: number;
  },
) {
  return apiRequest<BannerSetResponse>("/api/admin/home-banners", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateAdminHomeBanner(
  accessToken: string,
  id: string,
  body: {
    alt_text?: string;
    desktop_image_url?: string;
    mobile_image_url?: string;
    expected_revision: number;
  },
) {
  return apiRequest<BannerSetResponse>(
    `/api/admin/home-banners/${id}`,
    {
      method: "PATCH",
      accessToken,
      body,
    },
  );
}

export async function reorderAdminHomeBanners(
  accessToken: string,
  body: { ordered_ids: string[]; expected_revision: number },
) {
  return apiRequest<BannerSetResponse>(
    "/api/admin/home-banners/reorder",
    {
      method: "PATCH",
      accessToken,
      body,
    },
  );
}

export async function deleteAdminHomeBanner(
  accessToken: string,
  id: string,
  expectedRevision: number,
) {
  return apiRequest<BannerSetResponse>(
    `/api/admin/home-banners/${id}`,
    {
      method: "DELETE",
      accessToken,
      body: { expected_revision: expectedRevision },
    },
  );
}

export async function syncAdminHomeBanners(accessToken: string) {
  return apiRequest<BannerSetResponse>("/api/admin/home-banners/sync", {
    method: "POST",
    accessToken,
  });
}
