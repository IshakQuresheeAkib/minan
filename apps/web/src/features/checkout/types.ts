export type CartSnapshotItem = {
  product_id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export type CartSnapshot = {
  items: CartSnapshotItem[];
  total: number;
};

export type CheckoutSource = "cart" | "buy_now";

export type PaymentMethod = "bkash_full" | "cod";

export type PaymentPurpose = "delivery_fee" | "order_total" | "legacy_full_order";

export type CheckoutPaymentContract = {
  version: 2;
  methods: ["bkash_full", "cod"];
};

export type ShippingZone = "inside_sylhet" | "outside_sylhet";

export type ShippingOption = {
  id: ShippingZone;
  label: string;
  delivery_fee: number;
};

export type CheckoutConfig = {
  delivery_fee: number;
  shipping_options?: [ShippingOption, ShippingOption];
  currency: "BDT";
  refundable: false;
  payment_contract?: CheckoutPaymentContract;
};

export type PaymentStartContract = {
  payment_contract_version?: 2;
  payment_method?: PaymentMethod;
  pay_now_amount?: number;
};

export type PaymentStartResult = PaymentStartContract & (
  | { state: "redirect"; bkash_url: string }
  | { state: "processing" }
  | { state: "completed"; reference: string }
  | { state: "failed"; message: string; retry_token: string }
);

export type PaymentResult = {
  state:
    | "creating"
    | "initiated"
    | "completed"
    | "payment_create_failed"
    | "failed"
    | "cancelled"
    | "verification_pending"
    | "expired"
    | "unavailable";
  message: string;
  order_id?: string;
  order_number?: string;
  checkout_source?: CheckoutSource;
  payment_method?: PaymentMethod;
  payment_purpose?: PaymentPurpose;
  pay_now_amount?: number;
  fee_paid?: number;
  merchandise_paid_online?: number;
  cod_due?: number;
  financial_review_required?: boolean;
  merchant_invoice_number?: string;
  bkash_trx_id?: string;
  retry_token?: string;
};
