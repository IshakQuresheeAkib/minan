export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
} as const;
