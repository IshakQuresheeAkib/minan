import mongoose, { type Document, Schema, Types } from "mongoose";

export type PaymentAttemptStatus =
  | "creating"
  | "initiated"
  | "completed"
  | "payment_create_failed"
  | "failed"
  | "cancelled"
  | "verification_pending"
  | "expired";

export type PaymentPurpose = "delivery_fee" | "legacy_full_order";

export interface PaymentAttemptDocument extends Document {
  lead_id?: Types.ObjectId;
  order_id?: Types.ObjectId;
  payment_purpose: PaymentPurpose;
  sequence: number;
  status: PaymentAttemptStatus;
  merchant_invoice_number: string;
  expected_amount: string;
  currency: "BDT";
  payment_id?: string;
  bkash_trx_id?: string;
  bkash_url?: string;
  success_signature_hash?: string;
  failure_signature_hash?: string;
  cancel_signature_hash?: string;
  provider_status_code?: string;
  provider_status_message?: string;
  execute_started_at?: Date;
  last_query_at?: Date;
  result_token_hash?: string;
  result_token_expires_at?: Date;
  retry_token_hash?: string;
  retry_token_expires_at?: Date;
  retry_token_claimed_at?: Date;
  retry_token_consumed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentAttemptSchema = new Schema<PaymentAttemptDocument>(
  {
    lead_id: { type: Schema.Types.ObjectId, ref: "Lead" },
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    payment_purpose: {
      type: String,
      enum: ["delivery_fee", "legacy_full_order"] satisfies PaymentPurpose[],
      required: true,
      default: "legacy_full_order",
    },
    sequence: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: [
        "creating",
        "initiated",
        "completed",
        "payment_create_failed",
        "failed",
        "cancelled",
        "verification_pending",
        "expired",
      ] satisfies PaymentAttemptStatus[],
      required: true,
      index: true,
    },
    merchant_invoice_number: { type: String, required: true, unique: true },
    expected_amount: { type: String, required: true },
    currency: { type: String, enum: ["BDT"], default: "BDT" },
    payment_id: { type: String, unique: true, sparse: true },
    bkash_trx_id: { type: String, unique: true, sparse: true },
    bkash_url: { type: String },
    success_signature_hash: { type: String, select: false },
    failure_signature_hash: { type: String, select: false },
    cancel_signature_hash: { type: String, select: false },
    provider_status_code: { type: String, maxlength: 32 },
    provider_status_message: { type: String, maxlength: 300 },
    execute_started_at: { type: Date },
    last_query_at: { type: Date },
    result_token_hash: { type: String, select: false },
    result_token_expires_at: { type: Date, select: false },
    retry_token_hash: { type: String, select: false },
    retry_token_expires_at: { type: Date, select: false },
    retry_token_claimed_at: { type: Date, select: false },
    retry_token_consumed_at: { type: Date, select: false },
  },
  { timestamps: true },
);

paymentAttemptSchema.index(
  { lead_id: 1, sequence: 1 },
  { unique: true, partialFilterExpression: { lead_id: { $type: "objectId" } } },
);
paymentAttemptSchema.index(
  { order_id: 1, sequence: 1 },
  { unique: true, partialFilterExpression: { order_id: { $type: "objectId" } } },
);
paymentAttemptSchema.index(
  { order_id: 1 },
  { partialFilterExpression: { order_id: { $type: "objectId" } } },
);
paymentAttemptSchema.index({ status: 1, createdAt: -1 });

export const PaymentAttempt = mongoose.model<PaymentAttemptDocument>(
  "PaymentAttempt",
  paymentAttemptSchema,
);
