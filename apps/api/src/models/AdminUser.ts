import argon2 from "argon2";
import mongoose, { type Document, Schema } from "mongoose";

export interface AdminUserDocument extends Document {
  email: string;
  password: string;
  is_active: boolean;
  refresh_token_hash: string | null;
  previous_refresh_token_hash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<AdminUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    refresh_token_hash: { type: String, default: null, select: false },
    previous_refresh_token_hash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const {
          password: _password,
          refresh_token_hash: _refreshTokenHash,
          previous_refresh_token_hash: _previousRefreshTokenHash,
          ...safe
        } = ret;
        return safe;
      },
    },
  },
);

adminUserSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await argon2.hash(this.password);
});

export const AdminUser = mongoose.model<AdminUserDocument>(
  "AdminUser",
  adminUserSchema,
);

export async function verifyAdminPassword(
  hashedPassword: string,
  candidate: string,
): Promise<boolean> {
  return argon2.verify(hashedPassword, candidate);
}
