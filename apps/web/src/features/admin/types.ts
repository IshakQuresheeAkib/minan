export type DashboardMetrics = {
  leadsToday: number;
  leadsThisMonth: number;
  topProduct: string | null;
  topCategory: string | null;
  trafficSources: readonly {
    source: string;
    count: number;
  }[];
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
