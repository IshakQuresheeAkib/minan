export type ProductResponse = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: string;
  sizes: string[];
  colors: string[];
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  data: ProductResponse[];
  total: number;
};

export type ProductDetailResponse = {
  data: ProductResponse;
};

export type ApiErrorResponse = {
  error: string;
};
