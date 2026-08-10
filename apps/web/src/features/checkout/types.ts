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

export type ShippingZone = "inside_sylhet" | "outside_sylhet";

export type ShippingOption = {
  id: ShippingZone;
  label: string;
  delivery_fee: number;
};

export type CheckoutConfig = {
  shipping_options: [ShippingOption, ShippingOption];
  currency: "BDT";
  refundable: false;
};

export type PaymentStartResult =
  | { state: "redirect"; bkash_url: string }
  | { state: "processing" }
  | { state: "completed"; reference: string }
  | { state: "failed"; message: string; retry_token: string };

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
  fee_paid?: number;
  cod_due?: number;
  merchant_invoice_number?: string;
  bkash_trx_id?: string;
  retry_token?: string;
};
