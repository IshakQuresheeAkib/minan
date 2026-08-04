import type { LeadDocument } from "../models/Lead.js";
import type { PaymentAttemptDocument } from "../models/PaymentAttempt.js";
import type { LeadResponse } from "../types/admin.types.js";

export function serializeLead(
  lead: LeadDocument,
  attempts: PaymentAttemptDocument[] = [],
): LeadResponse {
  return {
    _id: lead._id.toString(),
    name: lead.name,
    phone_number: lead.phone_number,
    email: lead.email ?? null,
    address: lead.address,
    notes: lead.notes ?? null,
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
    delivery_status: lead.delivery_status,
    checkout_source: lead.checkout_source,
    legacy_bkash_txn_id: lead.legacy_bkash_txn_id ?? null,
    latest_payment_status: attempts[0]?.status ?? null,
    payment_attempts: attempts.map((attempt) => ({
      _id: attempt._id.toString(),
      sequence: attempt.sequence,
      status: attempt.status,
      merchant_invoice_number: attempt.merchant_invoice_number,
      expected_amount: attempt.expected_amount,
      currency: attempt.currency,
      payment_id: attempt.payment_id ?? null,
      bkash_trx_id: attempt.bkash_trx_id ?? null,
      provider_status_code: attempt.provider_status_code ?? null,
      provider_status_message: attempt.provider_status_message ?? null,
      last_query_at: attempt.last_query_at?.toISOString() ?? null,
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
    })),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}
