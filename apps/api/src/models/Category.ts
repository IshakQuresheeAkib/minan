import mongoose, { type Document, Schema } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image_url: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Category = mongoose.model<CategoryDocument>(
  "Category",
  categorySchema,
);
