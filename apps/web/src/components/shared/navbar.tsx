import { Bell, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { publicRoutes } from "@/constants/routes";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-background px-4">
      <Link
        href={publicRoutes.home}
        className="font-display text-3xl font-bold tracking-tight text-foreground"
      >
        MINAN
      </Link>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled
          aria-label="Notifications"
          className="flex size-10 cursor-not-allowed items-center justify-center rounded-full bg-muted text-muted-foreground opacity-60"
        >
          <Bell className="size-5" aria-hidden="true" />
        </button>
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
