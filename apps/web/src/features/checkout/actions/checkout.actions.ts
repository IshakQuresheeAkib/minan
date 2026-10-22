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
  const uat = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("uat") : null;
  const query = uat ? `?uat=${encodeURIComponent(uat)}` : "";
  return client<{ data: PaymentStartResult }>(`/api/bkash/payments${query}`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
      ...(uat ? { "x-bkash-uat": uat } : {}),
    },
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
