import { z } from "zod";

import { slugify } from "../lib/slugify.js";
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from "../utils/productDescription.js";

const discountSchema = z
  .number()
  .int("Discount must be a whole number")
  .min(0, "Discount must be at least 0")
  .max(100, "Discount must be at most 100");

const slugStringSchema = z
  .string()
  .trim()
  .min(1, "Slug must not be empty")
  .refine((v) => slugify(v).length > 0, {
    message: "Slug must contain at least one alphanumeric character",
  });

const expectedRevisionSchema = z
  .number()
  .int("Revision must be a whole number")
  .min(1, "Revision must be at least 1");

const managedBannerImageUrlSchema = z
  .url("Banner image must be a valid URL")
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  }, "Banner image must be a secure Cloudinary URL");

const productDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(
    MAX_PRODUCT_DESCRIPTION_LENGTH,
    "Description is too long",
  );

export const productCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    slug: slugStringSchema.optional(),
    description: productDescriptionSchema.optional(),
    description_html: productDescriptionSchema.optional(),
    price: z.number().min(0, "Price must be at least 0"),
    discount: discountSchema.default(0),
    category_id: z.string().trim().min(1, "Category is required"),
    subcategory_id: z.string().trim().min(1).nullable().optional(),
    sizes: z.array(z.string().trim().min(1)).default([]),
    colors: z.array(z.string().trim().min(1)).default([]),
    images: z.array(z.url("Each image must be a valid URL")).default([]),
  })
  .refine(
    (value) =>
      value.description !== undefined || value.description_html !== undefined,
    { message: "Description is required", path: ["description_html"] },
  );

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: slugStringSchema.optional(),
    description: productDescriptionSchema.optional(),
    description_html: productDescriptionSchema.optional(),
    price: z.number().min(0).optional(),
    discount: discountSchema.optional(),
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

export const homeBannerCreateSchema = z.object({
  desktop_image_url: managedBannerImageUrlSchema,
  mobile_image_url: managedBannerImageUrlSchema,
  expected_revision: expectedRevisionSchema,
});

export const homeBannerUpdateSchema = z
  .object({
    desktop_image_url: managedBannerImageUrlSchema.optional(),
    mobile_image_url: managedBannerImageUrlSchema.optional(),
    expected_revision: expectedRevisionSchema,
  })
  .refine(
    (value) =>
      value.desktop_image_url !== undefined ||
      value.mobile_image_url !== undefined,
    { message: "At least one banner image is required" },
  );

export const homeBannerReorderSchema = z.object({
  ordered_ids: z
    .array(z.string().trim().min(1))
    .min(1, "At least one banner is required")
    .max(5, "Cannot order more than 5 banners")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "ordered_ids cannot contain duplicates",
    }),
  expected_revision: expectedRevisionSchema,
});

export const homeBannerDeleteSchema = z.object({
  expected_revision: expectedRevisionSchema,
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
export type HomeBannerCreateInput = z.infer<
  typeof homeBannerCreateSchema
>;
export type HomeBannerUpdateInput = z.infer<
  typeof homeBannerUpdateSchema
>;
export type HomeBannerReorderInput = z.infer<
  typeof homeBannerReorderSchema
>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
