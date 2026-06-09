export const publicRoutes = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  adminLogin: "/admin/login",
} as const;

export const adminRoutes = {
  dashboard: "/admin",
  products: "/admin/products",
  categories: "/admin/categories",
  leads: "/admin/leads",
  admins: "/admin/admins",
} as const;
