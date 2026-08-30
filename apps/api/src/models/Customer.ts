import argon2 from "argon2";
import mongoose, { type Document, Schema, Types } from "mongoose";

import { normalizeEmail } from "../lib/normalizeEmail.js";

export interface CustomerDocument extends Document<Types.ObjectId> {
  email: string;
  normalized_email: string;
  password_hash: string;
  is_active: boolean;
  session_version: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    email: { type: String, required: true, trim: true },
    normalized_email: { type: String, required: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    is_active: { type: Boolean, default: true },
    session_version: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const {
          password_hash: _passwordHash,
          normalized_email: _normalizedEmail,
          session_version: _sessionVersion,
          ...safe
        } = ret;
        return safe;
      },
    },
  },
);

customerSchema.pre("validate", function normalizeCustomerEmail() {
  this.normalized_email = normalizeEmail(this.email);
});

customerSchema.index({ normalized_email: 1 }, { unique: true });

export const Customer = mongoose.model<CustomerDocument>(
  "Customer",
  customerSchema,
);

export async function hashCustomerPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyCustomerPassword(
  hashedPassword: string,
  candidate: string,
): Promise<boolean> {
  return argon2.verify(hashedPassword, candidate);
}
