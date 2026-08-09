export type HomeBannerResponse = {
  _id: string;
  alt_text: string;
  desktop_image_url: string;
  mobile_image_url: string;
};

export type AdminHomeBannerSetResponse = {
  revision: number;
  banners: HomeBannerResponse[];
  storefront_sync_pending: boolean;
  pending_cleanup_count: number;
};
