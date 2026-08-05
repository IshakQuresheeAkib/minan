export type DashboardMetrics = {
  ordersToday: number;
  ordersThisMonth: number;
  newOrders: number;
  awaitingFee: number;
  processingPacking: number;
  shipped: number;
  returnsExceptions: number;
  topProduct: string | null;
  topCategory: string | null;
  trafficSources: readonly {
    source: string;
    count: number;
  }[];
};

export type OrderStatus = "new" | "confirmed" | "processing" | "packing" | "shipped" | "delivered" | "on_hold" | "cancelled" | "returned" | "exchanged";
export type DeliveryFeeStatus = "not_required" | "awaiting" | "processing" | "paid" | "failed" | "verification_pending" | "expired";
export type CodStatus = "not_required" | "due" | "collected" | "partially_refunded" | "refunded" | "waived";

export type AdminOrderLine = {
  line_id: string;
  product_id: string;
  name: string;
  unit_price: number;
  original_price: number;
  product_discount: number;
  size: string;
  color: string;
  quantity: number;
  allocated_order_discount: number;
  returned_quantity: number;
  credited_amount: number;
};

export type AdminOrder = {
  _id: string;
  order_number: string;
  name: string;
  phone_number: string;
  email: string;
  address: string;
  customer_notes: string | null;
  lines: AdminOrderLine[];
  checkout_source: "cart" | "buy_now" | "exchange";
  status: OrderStatus;
  held_from_status: "new" | "confirmed" | "processing" | "packing" | null;
  financials: {
    merchandise_subtotal: number;
    order_discount: number;
    merchandise_total: number;
    delivery_fee: number;
    overall_order_value: number;
    merchandise_paid_online: number;
    exchange_credit_applied: number;
    cod_due: number;
    cod_collected: number;
    merchandise_refunded: number;
    exchange_credit_issued: number;
  };
  delivery_fee_status: DeliveryFeeStatus;
  cod_status: CodStatus;
  courier_name: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  duplicate_order_ids: string[];
  duplicate_review_state: "none" | "pending" | "reviewed_unique" | "confirmed_duplicate";
  exchange_source_order_id: string | null;
  exchange_replacement_order_id: string | null;
  revision: number;
  financial_review_required: boolean;
  activity?: {
    actor_type: "system" | "admin" | "customer" | "migration";
    admin_id?: string;
    admin_email?: string;
    event: string;
    reason?: string;
    metadata?: Record<string, string | number | boolean | null>;
    created_at: string;
  }[];
  refunds?: {
    amount: number;
    method: "cash" | "bkash_manual" | "bank_transfer" | "other";
    reference?: string;
    reason: string;
    admin_email: string;
    created_at: string;
  }[];
  payment_attempts?: (AdminPaymentAttempt & { payment_purpose: "delivery_fee" | "legacy_full_order" })[];
  createdAt: string;
  updatedAt: string;
};

export type AuthSessionResponse = {
  accessToken: string;
};

export type AdminProduct = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  description_html: string | null;
  price: number;
  discount: number;
  discounted_price: number;
  category_id: string;
  category: {
    name: string;
    slug: string;
  } | null;
  subcategory_id: string | null;
  subcategory: {
    name: string;
    slug: string;
  } | null;
  sizes: string[];
  colors: string[];
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  _id: string;
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubcategory = {
  _id: string;
  category_id: string;
  category: {
    name: string;
    slug: string;
  } | null;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "delivery_failed"
  | "cancelled";

export type PaymentAttemptStatus =
  | "creating"
  | "initiated"
  | "completed"
  | "payment_create_failed"
  | "failed"
  | "cancelled"
  | "verification_pending"
  | "expired";

export type AdminPaymentAttempt = {
  _id: string;
  sequence: number;
  status: PaymentAttemptStatus;
  merchant_invoice_number: string;
  expected_amount: string;
  currency: "BDT";
  payment_id: string | null;
  bkash_trx_id: string | null;
  provider_status_code: string | null;
  provider_status_message: string | null;
  last_query_at: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminLead = {
  _id: string;
  name: string;
  phone_number: string;
  email: string | null;
  address: string;
  notes: string | null;
  cart_snapshot: {
    items: {
      product_id: string;
      name: string;
      price: number;
      original_price: number;
      discount: number;
      size: string;
      color: string;
      quantity: number;
    }[];
    total: number;
  } | null;
  delivery_status: DeliveryStatus;
  checkout_source: "cart" | "buy_now";
  legacy_bkash_txn_id: string | null;
  latest_payment_status: PaymentAttemptStatus | null;
  payment_attempts: AdminPaymentAttempt[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  _id: string;
  email: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type UploadSignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
};

export type AdminHomeBanner = {
  _id: string;
  desktop_image_url: string;
  mobile_image_url: string;
};

export type AdminHomeBannerSet = {
  revision: number;
  banners: AdminHomeBanner[];
  storefront_sync_pending: boolean;
  pending_cleanup_count: number;
};

export type ManagedImageAsset = {
  url: string;
  publicId: string;
};

export type AdminImageAsset = {
  url: string;
  publicId?: string;
};
