import { z } from "zod";

const localImagePathSchema = z
  .string()
  .regex(/^\/[a-zA-Z0-9/_\-.]+$/, "Invalid local banner image path");

export const homeBannerImageSchema = z.union([z.url(), localImagePathSchema]);

export const homeBannerSchema = z.object({
  _id: z.string().min(1),
  desktop_image_url: homeBannerImageSchema,
  mobile_image_url: homeBannerImageSchema,
});

export const homeBannerListSchema = z.object({
  data: z.array(homeBannerSchema).max(5),
});

export type HomeBanner = z.infer<typeof homeBannerSchema>;
