import { publicRoutes } from "@/constants/routes";

export const heroSlides = [
  {
    id: "promo-sale",
    tag: "Limited Offer",
    heading: ["40%", "Off Now"],
    body: "Discover our exclusive collection at unbeatable prices. Fresh styles, bold looks.",
    cta: "Shop Now",
    href: publicRoutes.products,
    imageSrc: "/hero/limited-offer.webp",
    imageAlt: "Golden fashion editorial look from MINAN",
    accent: "from-[#ff724b]/35 via-[#f5b836]/20 to-background",
    panel: "bg-[#f5b836]/30",
    stat: "2k+ looks",
  },
  {
    id: "promo-new",
    tag: "New Season",
    heading: ["New", "Arrivals"],
    body: "Be the first to explore styles fresh from our latest drops this week.",
    cta: "Explore",
    href: publicRoutes.products,
    imageSrc: "/hero/new-arrivals.jpg",
    imageAlt: "New season fashion arrivals styled for MINAN",
    accent: "from-[#fed65b]/40 via-[#ff724b]/15 to-background",
    panel: "bg-[#ff724b]/25",
    stat: "Fresh drop",
  },
] as const;
