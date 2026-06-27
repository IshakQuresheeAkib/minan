"use client";

import { Heart, Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon: typeof Home;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: publicRoutes.home, icon: Home },
  { id: "search", label: "Search", href: publicRoutes.products, icon: Search },
  { id: "favorites", label: "Favorites", icon: Heart, disabled: true },
  { id: "profile", label: "Profile", icon: User, disabled: true },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-screen-sm items-center justify-around rounded-t-xl bg-background/80 px-4 py-3 pb-6 shadow-lg backdrop-blur-md lg:max-w-4xl"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href ? pathname === item.href : false;

        if (item.disabled || !item.href) {
          return (
            <button
              key={item.id}
              type="button"
              disabled
              aria-label={item.label}
              className="flex cursor-not-allowed flex-col items-center justify-center px-4 py-2 text-muted-foreground opacity-50"
            >
              <Icon className="mb-1 size-5" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-wide">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center px-4 py-2 transition-colors duration-200",
              isActive
                ? "rounded-full bg-primary px-6 text-primary-foreground"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            <Icon
              className="mb-1 size-5"
              aria-hidden="true"
              fill={isActive ? "currentColor" : "none"}
            />
            <span className="text-[10px] font-semibold tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
