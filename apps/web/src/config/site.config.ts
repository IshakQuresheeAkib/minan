const defaultSiteUrl = "https://www.minanclothing.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;

export const siteConfig = {
  name: "MINAN",
  title: "MINAN — Official Store | Premium Fashion & Clothing Bangladesh",
  market: "Bangladesh",
  city: "Sylhet",
  postalCode: "3100",
  address: "Kumarpara Point, Opposite of Forid & Brothers, Sylhet, Bangladesh, 3100",
  streetAddress: "Kumarpara Point, Opposite of Forid & Brothers",
  description:
    "Shop premium men's, women's, and kids' fashion at MINAN Bangladesh. Discover shirts, pants, panjabi, footwear, and more with easy nationwide ordering.",
  url: siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl,
  contact: {
    phone: "+8801799854465",
    phoneDisplay: "01799-854465",
    whatsapp: "https://wa.me/8801799854465",
  },
  socials: {
    facebook: "https://www.facebook.com/minanclothing",
    instagram: "https://www.instagram.com/minanf9",
    tiktok: "https://www.tiktok.com/@minanclothing",
  },
  keywords: [
    "MINAN",
    "MINAN Clothing",
    "MINAN Bangladesh",
    "MINAN Sylhet",
    "MINAN official store",
    "minanclothing.com",
    "premium fashion Bangladesh",
    "panjabi online BD",
    "men clothing Sylhet",
    "contemporary clothing Bangladesh",
  ],
} as const;

export const siteOrigin = new URL(siteConfig.url);

export function getAbsoluteUrl(path = "/"): string {
  return new URL(path, siteOrigin).toString();
}
