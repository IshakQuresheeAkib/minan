import type { LeadStatus } from "../models/Lead.js";

export type CategoryResponse = {
  _id: string;
  name: string;
  slug: string;
  image_url: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListResponse = {
  data: CategoryResponse[];
  total: number;
  page: number;
  limit: number;
};

export type SubcategoryResponse = {
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

export type SubcategoryListResponse = {
  data: SubcategoryResponse[];
  total: number;
  page: number;
  limit: number;
};

export type LeadResponse = {
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

export type LeadListResponse = {
  data: LeadResponse[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUserResponse = {
  _id: string;
  email: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListResponse = {
  data: AdminUserResponse[];
  total: number;
};

export type UploadSignatureResponse = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};
