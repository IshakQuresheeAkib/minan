const defaultSiteUrl = "https://www.minanclothing.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;

export const siteConfig = {
  name: "MINAN",
  title: "Premium Fashion & Clothing in Bangladesh | MINAN",
  market: "Bangladesh",
  city: "Sylhet",
  description:
    "Shop premium men's, women's, and kids' fashion at MINAN Bangladesh. Discover shirts, pants, panjabi, footwear, and more with easy nationwide ordering.",
  url: siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl,
} as const;

export const siteOrigin = new URL(siteConfig.url);

export function getAbsoluteUrl(path = "/"): string {
  return new URL(path, siteOrigin).toString();
}
