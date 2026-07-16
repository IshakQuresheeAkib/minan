import mongoose, { type Document, Schema, type Types } from "mongoose";

import type { CategoryDocument } from "./Category.js";
import type { SubcategoryDocument } from "./Subcategory.js";

export interface ProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: Types.ObjectId | CategoryDocument;
  subcategory_id?: Types.ObjectId | SubcategoryDocument | null;
  sizes: string[];
  colors: string[];
  images: string[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory_id: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
      index: true,
    },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model<ProductDocument>(
  "Product",
  productSchema,
);
