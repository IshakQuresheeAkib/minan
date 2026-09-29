import type { HomeBanner } from "@/features/home/schemas/home-banner.schema";

export const fallbackHomeBanners: HomeBanner[] = [
  {
    _id: "fallback-desktop-fallback",
    alt_text:
      "Three men wearing brown, sage green, and ivory MINAN panjabi in an arched interior",
    desktop_image_url: "/hero/desktop-fallback.webp",
    mobile_image_url: "/hero/desktop-fallback.webp",
  },
  {
    _id: "fallback-mobile-fallback",
    alt_text:
      "Two models wearing maroon embroidered MINAN panjabi from the Eid collection",
    desktop_image_url: "/hero/mobile-fallback.webp",
    mobile_image_url: "/hero/mobile-fallback.webp",
  },
];
