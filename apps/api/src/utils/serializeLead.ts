import type { LeadDocument } from "../models/Lead.js";
import type { LeadResponse } from "../types/admin.types.js";

export function serializeLead(lead: LeadDocument): LeadResponse {
  return {
    _id: lead._id.toString(),
    name: lead.name,
    phone_number: lead.phone_number,
    email: lead.email ?? null,
    address: lead.address,
    notes: lead.notes ?? null,
    bkash_txn_id: lead.bkash_txn_id ?? null,
    cart_snapshot: lead.cart_snapshot
      ? {
          items: lead.cart_snapshot.items.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            original_price: item.original_price ?? item.price,
            discount: item.discount ?? 0,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          total: lead.cart_snapshot.total,
        }
      : null,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}
