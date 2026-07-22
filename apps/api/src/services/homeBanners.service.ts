import { HomeBannerSet } from "../models/HomeBannerSet.js";
import { serializeHomeBanner } from "../utils/serializeHomeBannerSet.js";

export async function listHomeBanners() {
  const bannerSet = await HomeBannerSet.findOne({ key: "homepage" });

  return {
    data: bannerSet ? bannerSet.banners.map(serializeHomeBanner) : [],
  };
}
