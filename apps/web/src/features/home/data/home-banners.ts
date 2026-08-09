import type { HomeBanner } from "@/features/home/schemas/home-banner.schema";

export const fallbackHomeBanners: HomeBanner[] = [
  {
    _id: "fallback-limited-offer",
    alt_text:
      "Three men wearing brown, sage green, and ivory MINAN panjabi in an arched interior",
    desktop_image_url: "/hero/limited-offer.webp",
    mobile_image_url: "/hero/limited-offer.webp",
  },
  {
    _id: "fallback-new-arrivals",
    alt_text:
      "Two models wearing maroon embroidered MINAN panjabi from the Eid collection",
    desktop_image_url: "/hero/new-arrivals.jpg",
    mobile_image_url: "/hero/new-arrivals.jpg",
  },
];
