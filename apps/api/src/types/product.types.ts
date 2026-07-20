export type ProductCategorySummary = {
  name: string;
  slug: string;
};

export type ProductSubcategorySummary = {
  name: string;
  slug: string;
};

export type ProductFilterCategory = ProductCategorySummary & {
  subcategories: ProductSubcategorySummary[];
};

export type ProductResponse = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  category_id: string;
  category: ProductCategorySummary | null;
  subcategory_id: string | null;
  subcategory: ProductSubcategorySummary | null;
  sizes: string[];
  colors: string[];
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ProductDetailResponse = {
  data: ProductResponse;
};

export type ProductFilterOptionsResponse = {
  data: {
    categories: ProductFilterCategory[];
    colors: string[];
    sizes: string[];
    price: {
      min: number;
      max: number;
    };
  };
};

export type ApiErrorResponse = {
  error: string;
};
