"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { primaryNavItems } from "@/constants/nav-items";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.75);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 transition-all duration-300",
        "lg:fixed lg:left-0 lg:right-0 lg:top-0 lg:z-50 lg:h-20 lg:px-10",
        scrolled
          ? "bg-background/95 shadow-sm backdrop-blur-md"
          : "bg-background lg:bg-transparent",
      )}
    >
      {/* Mobile: logo + search row */}
      <div className="flex w-full items-center gap-3 lg:hidden">
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
            className="h-14 w-auto"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar variant="navbar" />
        </div>
      </div>

      {/* Desktop layout */}
      <Link
        href={publicRoutes.home}
        aria-label="MINAN — go to homepage"
        className="hidden shrink-0 transition-opacity duration-200 hover:opacity-85 lg:block"
      >
        <Image
          src="/logo.png"
          alt="MINAN"
          width={364}
          height={353}
          priority
          className="h-10 w-auto"
        />
      </Link>

      <nav
        aria-label="Main navigation"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex"
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

      <div className="hidden shrink-0 items-center gap-1 lg:flex">
        {searchOpen ? (
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 backdrop-blur-sm">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search products…"
              autoFocus
              aria-label="Search products"
              className="w-44 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-foreground/5 text-foreground/50 transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
