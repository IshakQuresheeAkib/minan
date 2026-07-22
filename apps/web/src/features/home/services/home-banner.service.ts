import { homeBannerListSchema } from "@/features/home/schemas/home-banner.schema";
import { apiRequest } from "@/lib/api/client";

export async function getHomeBanners() {
  const response = await apiRequest<unknown>("/api/home-banners");
  return homeBannerListSchema.parse(response).data;
}
