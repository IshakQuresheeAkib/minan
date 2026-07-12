import type { LucideIcon } from "lucide-react";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  Shield,
  Users,
} from "lucide-react";

import { adminRoutes } from "@/constants/routes";

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavLinks: AdminNavLink[] = [
  {
    href: adminRoutes.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: adminRoutes.products,
    label: "Products",
    icon: Package,
  },
  {
    href: adminRoutes.categories,
    label: "Categories",
    icon: FolderTree,
  },
  {
    href: adminRoutes.leads,
    label: "Leads",
    icon: Users,
  },
  {
    href: adminRoutes.admins,
    label: "Admins",
    icon: Shield,
  },
];
