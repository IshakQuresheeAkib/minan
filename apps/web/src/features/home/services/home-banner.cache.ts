import { cacheLife, cacheTag } from "next/cache";

import { getHomeBanners } from "@/features/home/services/home-banner.service";

export const HOME_BANNERS_CACHE_TAG = "home-banners";

export async function getCachedHomeBanners() {
  "use cache";
  cacheTag(HOME_BANNERS_CACHE_TAG);
  cacheLife("minutes");

  return getHomeBanners();
}
