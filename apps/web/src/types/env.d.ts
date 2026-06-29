declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_META_PIXEL_ID?: string;
    NEXT_PUBLIC_GA4_ID?: string;
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
    JWT_ACCESS_SECRET?: string;
  }
}
