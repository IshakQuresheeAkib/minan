import mongoose, { type Document, Schema } from "mongoose";

export interface BkashTokenDocument extends Document {
  key: "checkout-url";
  id_token: string;
  refresh_token?: string;
  expires_at: Date;
  refresh_expires_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bkashTokenSchema = new Schema<BkashTokenDocument>(
  {
    key: { type: String, enum: ["checkout-url"], unique: true, required: true },
    id_token: { type: String, required: true, select: false },
    refresh_token: { type: String, select: false },
    expires_at: { type: Date, required: true },
    refresh_expires_at: { type: Date },
  },
  { timestamps: true },
);

export const BkashToken = mongoose.model<BkashTokenDocument>(
  "BkashToken",
  bkashTokenSchema,
);
