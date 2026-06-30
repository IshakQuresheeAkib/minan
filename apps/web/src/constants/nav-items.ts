import type { LucideIcon } from "lucide-react";
import { Heart, Home, LayoutGrid, ShoppingBag } from "lucide-react";

import { publicRoutes } from "@/constants/routes";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const primaryNavItems: NavItem[] = [
  { id: "home", label: "Home", href: publicRoutes.home, icon: Home },
  {
    id: "products",
    label: "Products",
    href: publicRoutes.products,
    icon: LayoutGrid,
  },
  {
    id: "cart",
    label: "My cart",
    href: publicRoutes.cart,
    icon: ShoppingBag,
  },
];
