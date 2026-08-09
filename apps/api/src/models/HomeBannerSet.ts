import mongoose, { type Document, Schema, Types } from "mongoose";

export interface HomeBannerSubdocument {
  _id: Types.ObjectId;
  alt_text: string;
  desktop_image_url: string;
  mobile_image_url: string;
}

export interface HomeBannerSetDocument extends Document {
  key: "homepage";
  revision: number;
  banners: Types.DocumentArray<HomeBannerSubdocument>;
  storefront_sync_pending: boolean;
  pending_cleanup_urls: string[];
  createdAt: Date;
  updatedAt: Date;
}

const homeBannerSchema = new Schema<HomeBannerSubdocument>(
  {
    alt_text: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    desktop_image_url: { type: String, required: true, trim: true },
    mobile_image_url: { type: String, required: true, trim: true },
  },
  { _id: true, id: false },
);

const homeBannerSetSchema = new Schema<HomeBannerSetDocument>(
  {
    key: {
      type: String,
      enum: ["homepage"],
      required: true,
      unique: true,
      immutable: true,
    },
    revision: { type: Number, required: true, min: 1, default: 1 },
    banners: {
      type: [homeBannerSchema],
      required: true,
      validate: {
        validator: (banners: HomeBannerSubdocument[]) =>
          banners.length >= 1 && banners.length <= 5,
        message: "Homepage must have between 1 and 5 banners",
      },
    },
    storefront_sync_pending: { type: Boolean, default: false },
    pending_cleanup_urls: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const HomeBannerSet = mongoose.model<HomeBannerSetDocument>(
  "HomeBannerSet",
  homeBannerSetSchema,
);
