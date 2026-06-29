export const env = {
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
} as const;
