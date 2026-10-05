"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  FolderTree,
  Images,
  Shield,
  HelpCircle,
  Settings,
  Home,
  LogOut,
  X,
} from "lucide-react";

import { adminRoutes, publicRoutes } from "@/constants/routes";
import { logoutAdmin } from "@/features/admin/actions/auth.actions";
import { useOrdersNotifications } from "@/features/admin/components/OrdersNotificationProvider";
import { AdminTopBar } from "@/features/admin/components/AdminTopBar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type AdminShellProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    href: adminRoutes.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: adminRoutes.orders,
    label: "Orders",
    icon: ClipboardList,
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
    href: adminRoutes.homeBanners,
    label: "Banners",
    icon: Images,
  },
  {
    href: adminRoutes.admins,
    label: "Admins",
    icon: Shield,
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const { unreadCount } = useOrdersNotifications();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="min-h-screen bg-[#F6F1EB] text-[#1C1917] antialiased selection:bg-[#EBDDC8]">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-28 flex-col items-center justify-between border-r border-[#E8E1D5]/70 bg-[#F6F1EB] py-6 lg:flex">
        {/* Top: Brand Logo */}
        <div className="flex flex-col items-center">
          <Link
            href={adminRoutes.dashboard}
            className="group flex flex-col items-center text-center focus:outline-none"
          >
            <span className="font-display text-sm font-bold tracking-[0.25em] text-[#1C1917] transition-opacity group-hover:opacity-75">
              MINAN
            </span>
            <span className="text-[9px] font-medium tracking-[0.2em] text-neutral-400">
              &amp; CO.
            </span>
          </Link>
        </div>

        {/* Center: Main Navigation Tab Items */}
        <nav aria-label="Admin Navigation" className="my-auto flex flex-col items-center gap-3 w-full px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === adminRoutes.dashboard
                ? pathname === adminRoutes.dashboard
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full py-2.5 px-2 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-white/95 text-[#1C1917] shadow-[0_4px_16px_-2px_rgba(40,30,20,0.06)] border border-[#E4DBD0]"
                    : "text-neutral-500 hover:bg-white/50 hover:text-neutral-900",
                )}
              >
                {/* Active Tab Inverted Curved Corner Fillets & Sculpted Notch */}
                {isActive ? (
                  <>
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-[#1C1917]" />
                    {/* Top concave fillet */}
                    <div className="pointer-events-none absolute -top-2.5 right-1 size-2.5 overflow-hidden">
                      <svg viewBox="0 0 10 10" className="size-full fill-white/95">
                        <path d="M 0 0 C 6 0 10 4 10 10 L 10 0 Z" />
                      </svg>
                    </div>
                    {/* Bottom concave fillet */}
                    <div className="pointer-events-none absolute -bottom-2.5 right-1 size-2.5 overflow-hidden">
                      <svg viewBox="0 0 10 10" className="size-full fill-white/95">
                        <path d="M 10 0 C 10 6 6 10 0 10 L 10 10 Z" />
                      </svg>
                    </div>
                  </>
                ) : null}

                <div className="relative">
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isActive ? "stroke-[2.2] scale-105 text-[#1C1917]" : "stroke-[1.8]",
                    )}
                    aria-hidden="true"
                  />
                  {item.href === adminRoutes.orders && unreadCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "mt-1 text-[11px] font-medium tracking-tight",
                    isActive ? "font-bold text-[#1C1917]" : "text-neutral-500",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings, Storefront, Help & Logout */}
        <div className="flex flex-col items-center gap-2">
          {/* Help button */}
          <button
            type="button"
            title="Help & Guides"
            onClick={() => router.push(adminRoutes.dashboard)}
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 hover:text-neutral-800"
          >
            <HelpCircle className="size-4.5 stroke-[1.8]" />
          </button>

          {/* Settings / Admins */}
          <Link
            href={adminRoutes.admins}
            title="Settings"
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 hover:text-neutral-800"
          >
            <Settings className="size-4.5 stroke-[1.8]" />
          </Link>

          {/* Storefront Link */}
          <Link
            href={publicRoutes.home}
            title="View Storefront"
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 hover:text-neutral-800"
          >
            <Home className="size-4.5 stroke-[1.8]" />
          </Link>
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OUT NAV ================= */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#F6F1EB] p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display text-lg font-bold tracking-[0.2em] text-[#1C1917]">
                    MINAN &amp; CO.
                  </span>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
                    Admin Portal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-full p-1.5 text-neutral-500 hover:bg-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="mt-8 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === adminRoutes.dashboard
                      ? pathname === adminRoutes.dashboard
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-white font-bold text-[#1C1917] shadow-xs"
                          : "text-neutral-600 hover:bg-white/60",
                      )}
                    >
                      <Icon className="size-4.5" />
                      <span>{item.label}</span>
                      {item.href === adminRoutes.orders && unreadCount > 0 ? (
                        <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[#EAE1D4] pt-4 space-y-2">
              <Link
                href={publicRoutes.home}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-white/60"
              >
                <Home className="size-4" />
                <span>Storefront</span>
              </Link>
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="size-4" />
                <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="lg:pl-28 flex flex-col min-h-screen">
        <AdminTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
