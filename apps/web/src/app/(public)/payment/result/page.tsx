import { PaymentResultClient } from "@/features/checkout/components/PaymentResultClient";
import type { PaymentResult } from "@/features/checkout/types";
import { resolvePaymentResult } from "@/lib/api/server";

type PaymentResultPageProps = {
  searchParams: Promise<{ reference?: string | string[] }>;
};

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
  const params = await searchParams;
  const reference = Array.isArray(params.reference) ? params.reference[0] : params.reference;
  let result: PaymentResult = {
    state: "unavailable",
    message: "This payment result is unavailable or expired.",
  };

  if (reference) {
    try {
      result = await resolvePaymentResult(reference);
    } catch {
      result = {
        state: "unavailable",
        message: "We could not load the payment result. Your cart is still intact.",
      };
    }
  }

  return <PaymentResultClient result={result} />;
}
