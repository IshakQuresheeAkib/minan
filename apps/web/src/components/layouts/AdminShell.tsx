"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/features/admin/actions/auth.actions";
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAuthStore, type AdminRole } from "@/store/auth.store";

const allAdminLinks = [
  {
    href: adminRoutes.dashboard,
    label: "Dashboard",
    roles: ["general", "premium"] as const,
  },
  {
    href: adminRoutes.products,
    label: "Products",
    roles: ["premium"] as const,
  },
  {
    href: adminRoutes.categories,
    label: "Categories",
    roles: ["premium"] as const,
  },
  { href: adminRoutes.leads, label: "Leads", roles: ["premium"] as const },
  { href: adminRoutes.admins, label: "Admins", roles: ["premium"] as const },
] as const;

function canAccessLink(role: AdminRole | null, roles: readonly AdminRole[]) {
  return role !== null && roles.includes(role);
}

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleLinks = allAdminLinks.filter((link) =>
    canAccessLink(role, link.roles),
  );

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logoutAdmin();
    } finally {
      clearSession();
      router.replace(publicRoutes.adminLogin);
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background px-4 py-6 lg:block">
        <Link
          href={adminRoutes.dashboard}
          className="block text-lg font-semibold tracking-normal"
        >
          MINAN Admin
        </Link>
        <nav className="mt-8 grid gap-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
                "hover:bg-secondary hover:text-secondary-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={adminRoutes.dashboard}
              className="text-sm font-semibold lg:hidden"
            >
              MINAN Admin
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {role ?? "admin"}
              </p>
              <Button
                disabled={loggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {loggingOut ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
