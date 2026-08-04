import { z } from "zod";

import {
  hasRichDescriptionContent,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
} from "@/lib/productDescription";

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .max(MAX_PRODUCT_DESCRIPTION_LENGTH, "Description is too long")
    .refine(hasRichDescriptionContent, "Description is required"),
  price: z.number().min(0, "Price must be at least 0"),
  discount: z
    .number()
    .int("Discount must be a whole number")
    .min(0, "Discount must be at least 0")
    .max(100, "Discount must be at most 100"),
  category_id: z.string().trim().min(1, "Category is required"),
  subcategory_id: z.string(),
  sizes: z.string(),
  colors: z.string(),
});

export type AdminProductFormInput = z.infer<typeof adminProductFormSchema>;

export const adminCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
  image_url: z.string().optional(),
});

export type AdminCategoryFormInput = z.infer<typeof adminCategoryFormSchema>;

export const adminHomeBannerFormSchema = z.object({
  desktop_image_url: z.string().trim().min(1, "Desktop image is required"),
  mobile_image_url: z.string().trim().min(1, "Mobile image is required"),
});

export type AdminHomeBannerFormInput = z.infer<
  typeof adminHomeBannerFormSchema
>;

export const adminSubcategoryFormSchema = z.object({
  category_id: z.string().trim().min(1, "Category is required"),
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
});

export type AdminSubcategoryFormInput = z.infer<
  typeof adminSubcategoryFormSchema
>;

export const adminLeadUpdateSchema = z.object({
  delivery_status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "delivery_failed",
    "cancelled",
  ]),
  notes: z.string().trim().max(500),
});

export type AdminLeadUpdateInput = z.infer<typeof adminLeadUpdateSchema>;

export const adminCreateFormSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AdminCreateFormInput = z.infer<typeof adminCreateFormSchema>;

export const adminUpdateFormSchema = z.object({
  email: z.email("Enter a valid email address"),
  is_active: z.boolean(),
});

export type AdminUpdateFormInput = z.infer<typeof adminUpdateFormSchema>;

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
