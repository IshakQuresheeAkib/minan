import type { LeadInput } from "@/features/checkout/schemas/lead.schema";
import type {
  CartSnapshot,
  CheckoutSource,
  PaymentStartResult,
} from "@/features/checkout/types";
import { apiRequest } from "@/lib/api/client";
import { customerApiRequest } from "@/features/order-tracking/lib/orderTrackingApi";

export type PaymentCreateInput = LeadInput & {
  cart_snapshot: CartSnapshot;
  checkout_identity_mode: "customer" | "guest";
  checkout_source: CheckoutSource;
};

export async function startCheckoutPayment(
  body: PaymentCreateInput,
  idempotencyKey: string,
  customerAccessToken?: string,
): Promise<{ data: PaymentStartResult }> {
  const client = customerAccessToken ? customerApiRequest : apiRequest;
  return client<{ data: PaymentStartResult }>("/api/bkash/payments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    ...(customerAccessToken ? { accessToken: customerAccessToken } : {}),
    body,
  });
}

export async function retryCheckoutPayment(
  retryToken: string,
): Promise<{
  data: PaymentStartResult;
}> {
  return apiRequest("/api/bkash/payments/retry", {
    method: "POST",
    body: {
      retry_token: retryToken,
    },
  });
}
