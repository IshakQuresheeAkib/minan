import mongoose, { type Document, Schema } from "mongoose";

export type LeadStatus = "pending" | "confirmed" | "cancelled";

export type CartSnapshotItem = {
  product_id: string;
  name: string;
  price: number;
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
  email?: string;
  address: string;
  notes?: string;
  bkash_txn_id?: string;
  cart_snapshot?: CartSnapshot;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

const cartSnapshotItemSchema = new Schema<CartSnapshotItem>(
  {
    product_id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
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
    email: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    bkash_txn_id: { type: String, trim: true },
    cart_snapshot: { type: cartSnapshotSchema },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"] satisfies LeadStatus[],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Lead = mongoose.model<LeadDocument>("Lead", leadSchema);
