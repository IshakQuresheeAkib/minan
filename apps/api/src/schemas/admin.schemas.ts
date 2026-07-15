import { z } from "zod";

import { slugify } from "../lib/slugify.js";

const leadStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

const slugStringSchema = z
  .string()
  .trim()
  .min(1, "Slug must not be empty")
  .refine((v) => slugify(v).length > 0, {
    message: "Slug must contain at least one alphanumeric character",
  });

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: slugStringSchema.optional(),
  description: z.string().trim().min(1, "Description is required"),
  price: z.number().min(0, "Price must be at least 0"),
  category_id: z.string().trim().min(1, "Category is required"),
  subcategory_id: z.string().trim().min(1).nullable().optional(),
  sizes: z.array(z.string().trim().min(1)).default([]),
  colors: z.array(z.string().trim().min(1)).default([]),
  images: z.array(z.url("Each image must be a valid URL")).default([]),
});

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: slugStringSchema.optional(),
    description: z.string().trim().min(1).optional(),
    price: z.number().min(0).optional(),
    category_id: z.string().trim().min(1).optional(),
    subcategory_id: z.string().trim().min(1).nullable().optional(),
    sizes: z.array(z.string().trim().min(1)).optional(),
    colors: z.array(z.string().trim().min(1)).optional(),
    images: z.array(z.url("Each image must be a valid URL")).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: slugStringSchema.optional(),
  image_url: z.url("Image must be a valid URL"),
});

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: slugStringSchema.optional(),
    image_url: z.url("Image must be a valid URL").optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const subcategoryCreateSchema = z.object({
  category_id: z.string().trim().min(1, "Category is required"),
  name: z.string().trim().min(1, "Name is required"),
  slug: slugStringSchema.optional(),
});

export const subcategoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: slugStringSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const subcategoryReorderSchema = z.object({
  category_id: z.string().trim().min(1, "Category is required"),
  ordered_ids: z
    .array(z.string().trim().min(1))
    .min(1, "At least one subcategory is required")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "ordered_ids cannot contain duplicates",
    }),
});

export const uploadDeleteSchema = z.object({
  publicIds: z
    .array(z.string().trim().min(1, "publicIds cannot contain empty values"))
    .min(1, "At least one publicId is required")
    .max(50, "Cannot delete more than 50 images at once"),
});

export const leadUpdateSchema = z
  .object({
    status: leadStatusSchema.optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const adminCreateSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const adminUpdateSchema = z
  .object({
    email: z.email("Enter a valid email address").optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type SubcategoryCreateInput = z.infer<
  typeof subcategoryCreateSchema
>;
export type SubcategoryUpdateInput = z.infer<
  typeof subcategoryUpdateSchema
>;
export type SubcategoryReorderInput = z.infer<
  typeof subcategoryReorderSchema
>;
export type UploadDeleteInput = z.infer<typeof uploadDeleteSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
