"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Clock, LogOut, Menu } from "lucide-react";
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { useOrdersNotifications } from "@/features/admin/components/OrdersNotificationProvider";
import { useAuthStore } from "@/store/auth.store";
import { logoutAdmin } from "@/features/admin/actions/auth.actions";

export function AdminTopBar({
  onOpenMobileNav,
}: {
  onOpenMobileNav?: () => void;
}) {
  const router = useRouter();
  const { unreadCount } = useOrdersNotifications();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live real-time clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`${adminRoutes.products}?search=${encodeURIComponent(searchQuery.trim())}`);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
    } finally {
      clearSession();
      router.replace(publicRoutes.adminLogin);
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#EBE3D7]/80 bg-[#F6F1EB]/90 px-4 py-3.5 backdrop-blur-md transition-all sm:px-6 lg:px-8">
      {/* Mobile Menu Button & Overview Title */}
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
          Dashboard
        </h1>
      </div>

      {/* Central Search Bar */}
      <div className="hidden flex-1 max-w-md md:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, orders, categories..."
            className="w-full rounded-full border border-[#DFD6C8] bg-white/80 py-2 pl-10 pr-4 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 shadow-xs transition-all focus:border-[#C4B5A0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4B5A0]/20"
          />
        </form>
      </div>

      {/* Right Section: Live Time, Notifications, Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Live Clock Badge */}
        {currentTime ? (
          <div className="hidden items-center gap-1.5 rounded-full border border-[#E0D7C9] bg-white/80 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs sm:flex">
            <Clock className="size-3.5 text-neutral-400" />
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
          <div className="relative size-9 overflow-hidden rounded-full border-2 border-white bg-[#E5DCD0] shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Admin Profile"
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            title="Logout"
            className="hidden items-center justify-center rounded-full border border-[#E0D7C9] bg-white p-2 text-neutral-500 shadow-xs transition-colors hover:bg-rose-50 hover:text-rose-600 lg:flex"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
