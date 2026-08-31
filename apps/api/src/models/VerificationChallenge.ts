import mongoose, { type Document, Schema, Types } from "mongoose";

export type VerificationChallengePurpose = "guest_order_access";

export interface VerificationChallengeDocument extends Document<Types.ObjectId> {
  order_id: Types.ObjectId;
  normalized_email: string;
  purpose: VerificationChallengePurpose;
  otp_hash: string;
  attempt_count: number;
  attempt_limit: number;
  expires_at: Date;
  consumed_at: Date | null;
  revoked_at: Date | null;
  resend_available_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationChallengeSchema = new Schema<VerificationChallengeDocument>(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    normalized_email: { type: String, required: true, trim: true, maxlength: 254 },
    purpose: { type: String, enum: ["guest_order_access"], required: true },
    otp_hash: { type: String, required: true, select: false },
    attempt_count: { type: Number, required: true, default: 0, min: 0 },
    attempt_limit: { type: Number, required: true, min: 1, max: 10 },
    expires_at: { type: Date, required: true },
    consumed_at: { type: Date, default: null },
    revoked_at: { type: Date, default: null },
    resend_available_at: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { otp_hash: _otpHash, ...safe } = ret;
        return safe;
      },
    },
  },
);

verificationChallengeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
verificationChallengeSchema.index({
  order_id: 1,
  normalized_email: 1,
  purpose: 1,
  consumed_at: 1,
  revoked_at: 1,
  expires_at: 1,
});

export const VerificationChallenge = mongoose.model<VerificationChallengeDocument>(
  "VerificationChallenge",
  verificationChallengeSchema,
);
