"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Clock, LogOut, Menu } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import { useOrdersNotifications } from "@/features/admin/components/OrdersNotificationProvider";
import { SearchBar } from "@/components/shared/SearchBar";

const SECTION_TITLES: { prefix: string; label: string }[] = [
  { prefix: adminRoutes.orders, label: "Orders" },
  { prefix: adminRoutes.products, label: "Products" },
  { prefix: adminRoutes.categories, label: "Categories" },
  { prefix: adminRoutes.homeBanners, label: "Banners" },
  { prefix: adminRoutes.admins, label: "Admins" },
];

export function AdminTopBar({
  onOpenMobileNav,
  onLogout,
  loggingOut = false,
}: {
  onOpenMobileNav?: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useOrdersNotifications();
  const [currentTime, setCurrentTime] = useState("");
  const title = useMemo(() => {
    if (pathname === adminRoutes.dashboard) return "Dashboard";
    return (
      SECTION_TITLES.find((section) => pathname.startsWith(section.prefix))
        ?.label ?? "Admin"
    );
  }, [pathname]);

  // Live real-time clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Dhaka",
        }),
      );
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#EBE3D7]/80 bg-[#F6F1EB]/90 px-4 py-3.5 backdrop-blur-md transition-all print:hidden sm:px-6 lg:px-8">
      {/* Mobile Menu Button & Section Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="flex size-9 items-center justify-center rounded-xl border border-[#E0D7C9] bg-white text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        ) : null}

        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
          {title}
        </h1>
      </div>

      {/* Central Search Bar */}
      <div className="hidden flex-1 max-w-md md:block">
        <SearchBar
          variant="admin"
          alwaysOpen
          placeholder="Search catalog products..."
          onSearchSubmit={(query) => {
            const trimmed = query.trim();
            if (!trimmed) {
              router.push(adminRoutes.products);
              return;
            }
            router.push(
              `${adminRoutes.products}?search=${encodeURIComponent(trimmed)}`,
            );
          }}
        />
      </div>

      {/* Right Section: Live Time, Notifications, Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Live Clock Badge */}
        {currentTime ? (
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-white/80 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs sm:flex">
            <Clock className="size-3.5 text-primary" />
            <span>{currentTime}</span>
          </div>
        ) : null}

        {/* Notification Bell with Badge */}
        <Link
          href={adminRoutes.orders}
          aria-label={`${unreadCount} new order notifications`}
          className="relative flex size-9 items-center justify-center rounded-full border border-[#E0D7C9] bg-white/90 text-neutral-700 shadow-xs transition-all hover:bg-white hover:text-neutral-900"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>

        {/* Admin Avatar & Profile */}
        <div className="group relative flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-secondary via-primary to-primary font-display text-xs font-bold text-amber-950 shadow-sm">
            A
          </div>

          {onLogout ? (
            <button
              type="button"
              disabled={loggingOut}
              onClick={onLogout}
              title="Logout"
              className="hidden items-center justify-center rounded-full border border-[#E0D7C9] bg-white p-2 text-neutral-500 shadow-xs transition-colors hover:bg-rose-50 hover:text-rose-600 lg:flex"
            >
              <LogOut className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
