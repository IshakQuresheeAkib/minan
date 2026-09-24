
export const env = {
  apiProxyTarget: process.env.API_PROXY_TARGET ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  facebookPageUrl: process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;
