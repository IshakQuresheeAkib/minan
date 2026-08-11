import type {
  CheckoutPaymentContract,
  PaymentMethod,
  PaymentStartResult,
} from "@/features/checkout/types";

export function getPaymentSplit(
  method: PaymentMethod,
  merchandiseTotal: number,
  deliveryFee: number,
): { payNow: number; dueOnDelivery: number } {
  if (method === "bkash_full") {
    return {
      payNow: merchandiseTotal + deliveryFee,
      dueOnDelivery: 0,
    };
  }
  return {
    payNow: deliveryFee,
    dueOnDelivery: merchandiseTotal,
  };
}

export function paymentResponseMatchesContract(
  result: PaymentStartResult,
  contract: CheckoutPaymentContract | undefined,
  method: PaymentMethod,
  expectedPayNow: number,
): boolean {
  if (!contract) return true;
  return result.payment_contract_version === contract.version &&
    result.payment_method === method &&
    result.pay_now_amount === expectedPayNow;
}
