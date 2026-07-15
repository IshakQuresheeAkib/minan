import mongoose, { type Document, Schema, type Types } from "mongoose";

import type { CategoryDocument } from "./Category.js";

export interface SubcategoryDocument extends Document {
  category_id: Types.ObjectId | CategoryDocument;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<SubcategoryDocument>(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    display_order: { type: Number, required: true, min: 0, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subcategorySchema.index({ category_id: 1, display_order: 1, name: 1 });

export const Subcategory = mongoose.model<SubcategoryDocument>(
  "Subcategory",
  subcategorySchema,
);
