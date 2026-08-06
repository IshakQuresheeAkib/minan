import mongoose, { type Document, Schema, Types } from "mongoose";

export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "cancelled"
  | "returned"
  | "exchanged";

export type HoldableOrderStatus = "new" | "confirmed" | "processing" | "packing";
export type CheckoutSource = "cart" | "buy_now" | "exchange";
export type DeliveryFeeStatus =
  | "not_required"
  | "awaiting"
  | "processing"
  | "paid"
  | "failed"
  | "verification_pending"
  | "expired";
export type CodStatus =
  | "not_required"
  | "due"
  | "collected"
  | "partially_refunded"
  | "refunded"
  | "waived";

export type OrderLine = {
  line_id: string;
  product_id: string;
  name: string;
  unit_price: number;
  original_price: number;
  product_discount: number;
  size: string;
  color: string;
  quantity: number;
  allocated_order_discount: number;
  returned_quantity: number;
  credited_amount: number;
};

export type OrderFinancials = {
  merchandise_subtotal: number;
  order_discount: number;
  merchandise_total: number;
  delivery_fee: number;
  overall_order_value: number;
  merchandise_paid_online: number;
  exchange_credit_applied: number;
  cod_due: number;
  cod_collected: number;
  merchandise_refunded: number;
  exchange_credit_issued: number;
};

export type OrderActivity = {
  actor_type: "system" | "admin" | "customer" | "migration";
  admin_id?: string;
  admin_email?: string;
  event: string;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null>;
  created_at: Date;
};

export type OrderRefund = {
  amount: number;
  method: "cash" | "bkash_manual" | "bank_transfer" | "other";
  reference?: string;
  reason: string;
  admin_id: string;
  admin_email: string;
  created_at: Date;
};

export interface OrderDocument extends Document {
  order_number: string;
  name: string;
  phone_number: string;
  normalized_phone: string;
  email: string;
  address: string;
  customer_notes?: string;
  lines: OrderLine[];
  item_signature: string;
  checkout_source: CheckoutSource;
  checkout_idempotency_hash?: string;
  status: OrderStatus;
  held_from_status?: HoldableOrderStatus;
  financials: OrderFinancials;
  delivery_fee_status: DeliveryFeeStatus;
  cod_status: CodStatus;
  courier_name?: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  duplicate_order_ids: Types.ObjectId[];
  duplicate_review_state: "none" | "pending" | "reviewed_unique" | "confirmed_duplicate";
  exchange_source_order_id?: Types.ObjectId;
  exchange_replacement_order_id?: Types.ObjectId;
  revision: number;
  activity: OrderActivity[];
  refunds: OrderRefund[];
  financial_review_required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const money = { type: Number, required: true, min: 0, validate: Number.isSafeInteger };

const orderLineSchema = new Schema<OrderLine>(
  {
    line_id: { type: String, required: true },
    product_id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    unit_price: money,
    original_price: money,
    product_discount: { type: Number, required: true, min: 0, max: 100 },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    allocated_order_discount: money,
    returned_quantity: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    credited_amount: money,
  },
  { _id: false },
);

const activitySchema = new Schema<OrderActivity>(
  {
    actor_type: { type: String, enum: ["system", "admin", "customer", "migration"], required: true },
    admin_id: { type: String },
    admin_email: { type: String },
    event: { type: String, required: true, maxlength: 100 },
    reason: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
    created_at: { type: Date, required: true },
  },
  { _id: false },
);

const refundSchema = new Schema<OrderRefund>(
  {
    amount: money,
    method: { type: String, enum: ["cash", "bkash_manual", "bank_transfer", "other"], required: true },
    reference: { type: String, trim: true, maxlength: 120 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    admin_id: { type: String, required: true },
    admin_email: { type: String, required: true },
    created_at: { type: Date, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    order_number: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone_number: { type: String, required: true, trim: true, maxlength: 30 },
    normalized_phone: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    address: { type: String, required: true, trim: true, maxlength: 1000 },
    customer_notes: { type: String, trim: true, maxlength: 500 },
    lines: { type: [orderLineSchema], required: true },
    item_signature: { type: String, required: true },
    checkout_source: { type: String, enum: ["cart", "buy_now", "exchange"], required: true },
    checkout_idempotency_hash: { type: String, unique: true, sparse: true, select: false },
    status: {
      type: String,
      enum: ["new", "confirmed", "processing", "packing", "shipped", "delivered", "on_hold", "cancelled", "returned", "exchanged"],
      default: "new",
      index: true,
    },
    held_from_status: { type: String, enum: ["new", "confirmed", "processing", "packing"] },
    financials: {
      merchandise_subtotal: money,
      order_discount: money,
      merchandise_total: money,
      delivery_fee: money,
      overall_order_value: money,
      merchandise_paid_online: money,
      exchange_credit_applied: money,
      cod_due: money,
      cod_collected: money,
      merchandise_refunded: money,
      exchange_credit_issued: money,
    },
    delivery_fee_status: {
      type: String,
      enum: ["not_required", "awaiting", "processing", "paid", "failed", "verification_pending", "expired"],
      required: true,
      index: true,
    },
    cod_status: {
      type: String,
      enum: ["not_required", "due", "collected", "partially_refunded", "refunded", "waived"],
      required: true,
      index: true,
    },
    courier_name: { type: String, trim: true, maxlength: 120 },
    tracking_number: { type: String, trim: true, maxlength: 120 },
    shipped_at: { type: Date },
    delivered_at: { type: Date },
    duplicate_order_ids: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    duplicate_review_state: {
      type: String,
      enum: ["none", "pending", "reviewed_unique", "confirmed_duplicate"],
      default: "none",
    },
    exchange_source_order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    exchange_replacement_order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    revision: { type: Number, required: true, min: 1, default: 1 },
    activity: { type: [activitySchema], default: [] },
    refunds: { type: [refundSchema], default: [] },
    financial_review_required: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ delivery_fee_status: 1, createdAt: -1 });
orderSchema.index({ cod_status: 1, createdAt: -1 });
orderSchema.index({ normalized_phone: 1, item_signature: 1, createdAt: -1 });
orderSchema.index({ createdAt: 1, _id: 1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
