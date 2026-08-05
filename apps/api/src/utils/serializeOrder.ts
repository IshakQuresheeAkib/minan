import type { OrderDocument } from "../models/Order.js";
import type { PaymentAttemptDocument } from "../models/PaymentAttempt.js";

function date(value?: Date): string | null {
  return value?.toISOString() ?? null;
}

export function serializeOrder(
  order: OrderDocument,
  attempts: PaymentAttemptDocument[] = [],
  detailed = true,
) {
  const base = {
    _id: order._id.toString(),
    order_number: order.order_number,
    name: order.name,
    phone_number: order.phone_number,
    email: order.email,
    address: order.address,
    customer_notes: order.customer_notes ?? null,
    lines: order.lines.map((line) => ({
      line_id: line.line_id,
      product_id: line.product_id,
      name: line.name,
      unit_price: line.unit_price,
      original_price: line.original_price,
      product_discount: line.product_discount,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
      allocated_order_discount: line.allocated_order_discount,
      returned_quantity: line.returned_quantity,
      credited_amount: line.credited_amount,
    })),
    checkout_source: order.checkout_source,
    status: order.status,
    held_from_status: order.held_from_status ?? null,
    financials: {
      merchandise_subtotal: order.financials.merchandise_subtotal,
      order_discount: order.financials.order_discount,
      merchandise_total: order.financials.merchandise_total,
      delivery_fee: order.financials.delivery_fee,
      overall_order_value: order.financials.overall_order_value,
      merchandise_paid_online: order.financials.merchandise_paid_online,
      exchange_credit_applied: order.financials.exchange_credit_applied,
      cod_due: order.financials.cod_due,
      cod_collected: order.financials.cod_collected,
      merchandise_refunded: order.financials.merchandise_refunded,
      exchange_credit_issued: order.financials.exchange_credit_issued,
    },
    delivery_fee_status: order.delivery_fee_status,
    cod_status: order.cod_status,
    courier_name: order.courier_name ?? null,
    tracking_number: order.tracking_number ?? null,
    shipped_at: date(order.shipped_at),
    delivered_at: date(order.delivered_at),
    duplicate_order_ids: order.duplicate_order_ids.map((id) => id.toString()),
    duplicate_review_state: order.duplicate_review_state,
    exchange_source_order_id: order.exchange_source_order_id?.toString() ?? null,
    exchange_replacement_order_id: order.exchange_replacement_order_id?.toString() ?? null,
    revision: order.revision,
    financial_review_required: order.financial_review_required,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
  if (!detailed) return base;
  return {
    ...base,
    activity: order.activity.map((entry) => ({
      actor_type: entry.actor_type,
      admin_id: entry.admin_id,
      admin_email: entry.admin_email,
      event: entry.event,
      reason: entry.reason,
      metadata: entry.metadata,
      created_at: entry.created_at.toISOString(),
    })),
    refunds: order.refunds.map((refund) => ({
      amount: refund.amount,
      method: refund.method,
      reference: refund.reference,
      reason: refund.reason,
      admin_id: refund.admin_id,
      admin_email: refund.admin_email,
      created_at: refund.created_at.toISOString(),
    })),
    payment_attempts: attempts.map((attempt) => ({
      _id: attempt._id.toString(),
      sequence: attempt.sequence,
      status: attempt.status,
      payment_purpose: attempt.payment_purpose,
      merchant_invoice_number: attempt.merchant_invoice_number,
      expected_amount: attempt.expected_amount,
      currency: attempt.currency,
      payment_id: attempt.payment_id ?? null,
      bkash_trx_id: attempt.bkash_trx_id ?? null,
      provider_status_code: attempt.provider_status_code ?? null,
      provider_status_message: attempt.provider_status_message ?? null,
      last_query_at: date(attempt.last_query_at),
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
    })),
  };
}
