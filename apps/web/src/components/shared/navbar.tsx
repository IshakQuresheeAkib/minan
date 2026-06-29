"use client";

import { Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { label: "Home", href: publicRoutes.home },
  { label: "Products", href: publicRoutes.products },
] as const;

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
      {/* Logo */}
      <Link
        href={publicRoutes.home}
        className="font-display text-3xl font-bold tracking-tight text-foreground"
      >
        MINAN
      </Link>

      {/* Desktop center nav */}
      <nav
        aria-label="Main navigation"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
      >
        {desktopLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-semibold tracking-wide transition-colors duration-200",
              pathname === link.href
                ? "text-primary"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop right: search + cart */}
      <div className="hidden items-center gap-2 lg:flex">
        <div className="flex items-center">
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
                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-card/70 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <Link
          href={publicRoutes.cart}
          aria-label="Shopping bag"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-card/70 text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Mobile right icons */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link
          href={publicRoutes.cart}
          aria-label="Shopping bag"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-opacity hover:opacity-80"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
