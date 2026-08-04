import type { LeadInput } from "@/features/checkout/schemas/lead.schema";
import type {
  CartSnapshot,
  CheckoutSource,
  PaymentStartResult,
} from "@/features/checkout/types";
import { apiRequest } from "@/lib/api/client";

export type PaymentCreateInput = LeadInput & {
  cart_snapshot: CartSnapshot;
  checkout_source: CheckoutSource;
};

export async function startCheckoutPayment(
  body: PaymentCreateInput,
  idempotencyKey: string,
): Promise<{ data: PaymentStartResult }> {
  return apiRequest<{ data: PaymentStartResult }>("/api/bkash/payments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  });
}

export async function retryCheckoutPayment(
  retryToken: string,
  acceptedTotal?: number,
): Promise<{
  data:
    | PaymentStartResult
    | { state: "price_changed"; total: number; retry_token: string };
}> {
  return apiRequest("/api/bkash/payments/retry", {
    method: "POST",
    body: {
      retry_token: retryToken,
      accepted_total: acceptedTotal,
    },
  });
}
