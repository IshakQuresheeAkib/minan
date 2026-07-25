import { z } from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const productSubcategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const productSchema = z.object({
  _id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  discount: z.number().int().min(0).max(100),
  discounted_price: z.number().min(0),
  category_id: z.string().min(1),
  category: productCategorySchema.nullable(),
  subcategory_id: z.string().nullable(),
  subcategory: productSubcategorySchema.nullable(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  images: z.array(z.url()),
  is_active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productDetailSchema = productSchema.extend({
  description_html: z.string().nullable(),
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductSubcategory = z.infer<typeof productSubcategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
