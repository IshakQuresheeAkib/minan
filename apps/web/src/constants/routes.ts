export const publicRoutes = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  buyNowCheckout: "/checkout/buy-now",
  paymentResult: "/payment/result",
  adminLogin: "/admin/login",
} as const;

export const adminRoutes = {
  dashboard: "/admin",
  products: "/admin/products",
  categories: "/admin/categories",
  homeBanners: "/admin/home-banners",
  leads: "/admin/leads",
  orders: "/admin/orders",
  admins: "/admin/admins",
} as const;
