export const CHECKOUT_PAYMENT_CONTRACT_VERSION = 2 as const;

export const paymentMethods = ["bkash_full", "cod"] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export type CheckoutPaymentContract = {
  version: typeof CHECKOUT_PAYMENT_CONTRACT_VERSION;
  methods: ["bkash_full", "cod"];
};

export function getCheckoutPaymentContract(): CheckoutPaymentContract {
  return {
    version: CHECKOUT_PAYMENT_CONTRACT_VERSION,
    methods: ["bkash_full", "cod"],
  };
}
