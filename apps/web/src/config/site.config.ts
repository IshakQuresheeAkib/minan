const defaultSiteUrl = "https://www.minanclothing.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;

export const siteConfig = {
  name: "MINAN",
  market: "Bangladesh",
  city: "Sylhet",
  description:
    "Premium fashion brand in Bangladesh.",
  url: siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl,
} as const;

export const siteOrigin = new URL(siteConfig.url);

export function getAbsoluteUrl(path = "/"): string {
  return new URL(path, siteOrigin).toString();
}
