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
  role: "general" | "premium";
};

export type AdminProduct = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: string;
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

export type LeadStatus = "pending" | "confirmed" | "cancelled";

export type AdminLead = {
  _id: string;
  name: string;
  phone_number: string;
  email: string | null;
  address: string;
  notes: string | null;
  bkash_txn_id: string | null;
  cart_snapshot: {
    items: {
      product_id: string;
      name: string;
      price: number;
      size: string;
      color: string;
      quantity: number;
    }[];
    total: number;
  } | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  _id: string;
  email: string;
  role: "general" | "premium";
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
};
