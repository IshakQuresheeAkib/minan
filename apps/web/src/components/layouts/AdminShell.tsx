"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { adminNavLinks } from "@/constants/admin-nav";
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { logoutAdmin } from "@/features/admin/actions/auth.actions";
import { AdminMobileNav } from "@/features/admin/components/AdminMobileNav";
import { useOrdersNotifications } from "@/features/admin/components/OrdersNotificationProvider";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = useState(false);
  const { unreadCount } = useOrdersNotifications();

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
    <div className="min-h-dvh bg-background/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background px-4 py-6 print:hidden lg:flex">
        <div>
          <Link
            href={adminRoutes.dashboard}
            className="block text-lg font-semibold tracking-normal"
          >
            MINAN Admin
          </Link>
          <nav aria-label="Admin navigation" className="mt-8 grid gap-1">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {link.label}
                  {link.href === adminRoutes.orders && unreadCount > 0 ? (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-foreground" aria-label={`${unreadCount} unread Orders`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <nav
          aria-label="Storefront navigation"
          className="mt-auto border-t pt-2"
        >
          <Link
            href={publicRoutes.home}
            aria-current={pathname === publicRoutes.home ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === publicRoutes.home
                ? "bg-secondary text-foreground"
                : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Home className="size-4 shrink-0" aria-hidden="true" />
            Home
          </Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/90 px-4 py-3 backdrop-blur print:hidden sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <AdminMobileNav
                visibleLinks={adminNavLinks}
                loggingOut={loggingOut}
                onLogout={() => {
                  void handleLogout();
                }}
              />
              <Link
                href={adminRoutes.dashboard}
                className="truncate text-sm font-semibold"
              >
                MINAN Admin
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <p className="text-xs font-medium uppercase text-foreground/70">
                Admin
              </p>
              <Button
                disabled={loggingOut}
                onClick={() => {
                  void handleLogout();
                }}
                size="sm"
                type="button"
                variant="secondary"
                className="hidden lg:inline-flex"
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
