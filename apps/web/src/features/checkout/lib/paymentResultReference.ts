import type { PaymentResult } from "@/features/checkout/types";

export function shouldStripPaymentResultReference(
  state: PaymentResult["state"],
): boolean {
  return state === "completed";
}
