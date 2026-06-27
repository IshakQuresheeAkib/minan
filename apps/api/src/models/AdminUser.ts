import argon2 from "argon2";
import mongoose, { type Document, Schema } from "mongoose";

import type { AdminRole } from "../types/auth.types.js";

export interface AdminUserDocument extends Document {
  email: string;
  password: string;
  role: AdminRole;
  is_active: boolean;
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
    role: {
      type: String,
      enum: ["general", "premium"] satisfies AdminRole[],
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { password: _password, ...safe } = ret;
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
