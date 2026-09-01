export const publicRoutes = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  buyNowCheckout: "/checkout/buy-now",
  paymentResult: "/payment/result",
  orderTracking: "/orders",
  customerLogin: "/account/login",
  adminLogin: "/admin/login",
} as const;

export const adminRoutes = {
  dashboard: "/admin",
  products: "/admin/products",
  categories: "/admin/categories",
  homeBanners: "/admin/home-banners",
  orders: "/admin/orders",
  admins: "/admin/admins",
} as const;

export function getCollectionPath(slug: string): string {
  return `/collections/${encodeURIComponent(slug)}`;
}

export function getProductPath(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}
