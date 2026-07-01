"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavItems } from "@/constants/nav-items";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === publicRoutes.home;

  return (
    <header
      className={cn(
        "flex h-20 w-full items-center justify-between px-4 pt-2 lg:h-20 lg:px-10",
        isHome
          ? "border-b border-border/60 bg-background lg:absolute lg:inset-x-0 lg:top-0 lg:z-50 lg:border-b-0 lg:bg-transparent"
          : "border-b border-border/60 bg-background",
      )}
    >
      <div className="flex w-full items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(360px,1fr)_minmax(260px,340px)] lg:gap-8">
        <Link
          href={publicRoutes.home}
          aria-label="MINAN — go to homepage"
          className="shrink-0 transition-opacity duration-200 hover:opacity-85"
        >
          <Image
            src="/logo.png"
            alt="MINAN"
            width={364}
            height={353}
            priority
            className="h-20 w-auto lg:h-10"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-center gap-6 lg:flex"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.disabled || !item.href) {
              return (
                <span
                  key={item.id}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-1.5 text-sm font-semibold tracking-wide text-foreground/35"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                  isActive
                    ? "text-primary after:scale-x-100"
                    : "text-foreground/65 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 w-fit flex-1 lg:flex lg:justify-end">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
