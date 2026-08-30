import mongoose, { type Document, Schema, Types } from "mongoose";

export interface CustomerSessionDocument extends Document<Types.ObjectId> {
  customer_id: Types.ObjectId;
  session_version: number;
  refresh_token_hash: string;
  previous_refresh_token_hash: string | null;
  expires_at: Date;
  last_rotated_at: Date;
  revoked_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const customerSessionSchema = new Schema<CustomerSessionDocument>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    session_version: { type: Number, required: true, min: 0 },
    refresh_token_hash: { type: String, required: true, select: false },
    previous_refresh_token_hash: {
      type: String,
      default: null,
      select: false,
    },
    expires_at: { type: Date, required: true },
    last_rotated_at: { type: Date, required: true },
    revoked_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const {
          refresh_token_hash: _refreshTokenHash,
          previous_refresh_token_hash: _previousRefreshTokenHash,
          ...safe
        } = ret;
        return safe;
      },
    },
  },
);

customerSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
customerSessionSchema.index({ customer_id: 1, revoked_at: 1, expires_at: 1 });

export const CustomerSession = mongoose.model<CustomerSessionDocument>(
  "CustomerSession",
  customerSessionSchema,
);
