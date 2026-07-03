"use client";

import { Home, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AdminNavLink } from "@/constants/admin-nav";
import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/store/auth.store";

type AdminMobileNavProps = {
  visibleLinks: AdminNavLink[];
  role: AdminRole | null;
  loggingOut: boolean;
  onLogout: () => void;
};

export function AdminMobileNav({
  visibleLinks,
  role,
  loggingOut,
  onLogout,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0 border-0 bg-transparent text-foreground shadow-none hover:bg-secondary hover:text-secondary-foreground hover:shadow-none lg:hidden"
          aria-label="Open admin navigation menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-64 flex-col gap-0 p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="text-base">MINAN Admin</SheetTitle>
          {role ? (
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {role}
            </p>
          ) : null}
        </SheetHeader>

        <nav
          aria-label="Admin navigation"
          className="flex min-h-0 flex-1 flex-col p-2"
        >
          <div className="grid gap-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-secondary-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          <div className="mt-auto space-y-1 border-t pt-2">
            <SheetClose asChild>
              <Link
                href={publicRoutes.home}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === publicRoutes.home
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-secondary-foreground",
                )}
              >
                <Home className="size-4 shrink-0" aria-hidden="true" />
                Home
              </Link>
            </SheetClose>
            <Button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              variant="secondary"
              className={cn(
                "w-full justify-start rounded-md border-0 bg-transparent px-3 py-2 text-sm font-medium shadow-none",
                "text-muted-foreground hover:bg-secondary/60 hover:text-secondary-foreground",
                "hover:shadow-none disabled:pointer-events-none disabled:opacity-50",
              )}
              leftIcon={<LogOut className="size-4 shrink-0" aria-hidden="true" />}
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
