import "server-only";

import type { PaymentResult } from "@/features/checkout/types";

function apiBaseUrl(): string {
  const value = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  if (!value) throw new Error("API_PROXY_TARGET is not configured");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("API_PROXY_TARGET must use HTTPS in production");
  }
  return value;
}

export async function resolvePaymentResult(reference: string): Promise<PaymentResult> {
  const response = await fetch(`${apiBaseUrl()}/api/bkash/results/resolve`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ reference }),
  });
  if (!response.ok) throw new Error("Payment result could not be resolved");
  const payload = (await response.json()) as { data?: PaymentResult };
  if (!payload.data) throw new Error("Payment result response was incomplete");
  return payload.data;
}
