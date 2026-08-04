import mongoose, { type Document, Schema } from "mongoose";

export type DeliveryStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "delivery_failed"
  | "cancelled";

export type CheckoutSource = "cart" | "buy_now";

export type CartSnapshotItem = {
  product_id: string;
  name: string;
  price: number;
  original_price?: number;
  discount?: number;
  size: string;
  color: string;
  quantity: number;
};

export type CartSnapshot = {
  items: CartSnapshotItem[];
  total: number;
};

export interface LeadDocument extends Document {
  name: string;
  phone_number: string;
  email: string;
  address: string;
  notes?: string;
  cart_snapshot: CartSnapshot;
  delivery_status: DeliveryStatus;
  checkout_source: CheckoutSource;
  checkout_idempotency_hash?: string;
  legacy_bkash_txn_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cartSnapshotItemSchema = new Schema<CartSnapshotItem>(
  {
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    original_price: { type: Number, min: 0 },
    discount: { type: Number, min: 0, max: 100 },
    size: { type: String, required: true },
    color: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSnapshotSchema = new Schema<CartSnapshot>(
  {
    items: { type: [cartSnapshotItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const leadSchema = new Schema<LeadDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    cart_snapshot: { type: cartSnapshotSchema, required: true },
    delivery_status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "delivery_failed",
        "cancelled",
      ] satisfies DeliveryStatus[],
      default: "pending",
    },
    checkout_source: {
      type: String,
      enum: ["cart", "buy_now"] satisfies CheckoutSource[],
      default: "cart",
    },
    checkout_idempotency_hash: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    legacy_bkash_txn_id: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true },
);

export const Lead = mongoose.model<LeadDocument>("Lead", leadSchema);
