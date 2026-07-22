export const publicRoutes = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  buyNowCheckout: "/checkout/buy-now",
  adminLogin: "/admin/login",
} as const;

export const adminRoutes = {
  dashboard: "/admin",
  products: "/admin/products",
  categories: "/admin/categories",
  homeBanners: "/admin/home-banners",
  leads: "/admin/leads",
  admins: "/admin/admins",
} as const;
