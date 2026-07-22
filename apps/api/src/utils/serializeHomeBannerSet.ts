import type {
  HomeBannerSetDocument,
  HomeBannerSubdocument,
} from "../models/HomeBannerSet.js";
import type {
  AdminHomeBannerSetResponse,
  HomeBannerResponse,
} from "../types/homeBanner.types.js";

export function serializeHomeBanner(
  banner: HomeBannerSubdocument,
): HomeBannerResponse {
  return {
    _id: banner._id.toString(),
    desktop_image_url: banner.desktop_image_url,
    mobile_image_url: banner.mobile_image_url,
  };
}

export function serializeAdminHomeBannerSet(
  bannerSet: HomeBannerSetDocument,
): AdminHomeBannerSetResponse {
  return {
    revision: bannerSet.revision,
    banners: bannerSet.banners.map(serializeHomeBanner),
    storefront_sync_pending: bannerSet.storefront_sync_pending,
    pending_cleanup_count: bannerSet.pending_cleanup_urls.length,
  };
}
