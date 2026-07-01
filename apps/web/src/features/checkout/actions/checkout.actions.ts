import type { LeadInput } from "@/features/checkout/schemas/lead.schema";
import type { CartSnapshot, CheckoutLead } from "@/features/checkout/types";
import { apiRequest } from "@/lib/api/client";

export type LeadCreateInput = LeadInput & {
  cart_snapshot: CartSnapshot;
};

export async function submitCheckoutLead(
  body: LeadCreateInput,
): Promise<{ data: CheckoutLead }> {
  return apiRequest<{ data: CheckoutLead }>("/api/leads", {
    method: "POST",
    body,
  });
}
