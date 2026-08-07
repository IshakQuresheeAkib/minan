import mongoose, { type Types } from "mongoose";
import type { Collection } from "mongoose";

export type LegacyLead = {
  _id: Types.ObjectId;
  name: string;
  phone_number: string;
  email: string;
  address: string;
  notes?: string;
  cart_snapshot: {
    items: {
      product_id: string;
      name: string;
      price: number;
      original_price?: number;
      discount?: number;
      size: string;
      color: string;
      quantity: number;
    }[];
    total: number;
  };
  delivery_status?: string;
  checkout_source?: string;
  checkout_idempotency_hash?: string;
  legacy_bkash_txn_id?: string;
  bkash_txn_id?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Migration-only access to checkout records created before the Order domain.
 * Runtime code must use the Order model instead.
 */
export function legacyLeadsCollection(): Collection<LegacyLead> {
  return mongoose.connection.collection<LegacyLead>("leads");
}
