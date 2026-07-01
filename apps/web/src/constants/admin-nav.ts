import type { LucideIcon } from "lucide-react";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  Shield,
  Users,
} from "lucide-react";

import { adminRoutes } from "@/constants/routes";
import type { AdminRole } from "@/store/auth.store";

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: readonly AdminRole[];
};

export const adminNavLinks: AdminNavLink[] = [
  {
    href: adminRoutes.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["general", "premium"],
  },
  {
    href: adminRoutes.products,
    label: "Products",
    icon: Package,
    roles: ["premium"],
  },
  {
    href: adminRoutes.categories,
    label: "Categories",
    icon: FolderTree,
    roles: ["premium"],
  },
  {
    href: adminRoutes.leads,
    label: "Leads",
    icon: Users,
    roles: ["premium"],
  },
  {
    href: adminRoutes.admins,
    label: "Admins",
    icon: Shield,
    roles: ["premium"],
  },
];

export function canAccessAdminLink(
  role: AdminRole | null,
  roles: readonly AdminRole[],
) {
  return role !== null && roles.includes(role);
}

export function getVisibleAdminLinks(role: AdminRole | null) {
  return adminNavLinks.filter((link) => canAccessAdminLink(role, link.roles));
}
