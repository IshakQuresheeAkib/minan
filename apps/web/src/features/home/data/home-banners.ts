import type { HomeBanner } from "@/features/home/schemas/home-banner.schema";

export const fallbackHomeBanners: HomeBanner[] = [
  {
    _id: "fallback-limited-offer",
    desktop_image_url: "/hero/limited-offer.webp",
    mobile_image_url: "/hero/limited-offer.webp",
  },
  {
    _id: "fallback-new-arrivals",
    desktop_image_url: "/hero/new-arrivals.jpg",
    mobile_image_url: "/hero/new-arrivals.jpg",
  },
];
