"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Navbar } from "@/components/shared/navbar";
import { Toaster } from "@/components/ui/sonner";
import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";

type PublicChromeProps = {
  children: ReactNode;
};

function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+$/.test(pathname);
}

export function PublicChrome({ children }: PublicChromeProps) {
  const pathname = usePathname();
  const isProductDetail = isProductDetailPath(pathname);
  const isHome = pathname === publicRoutes.home;

  return (
    <div className="min-h-dvh bg-background">
      <div
        className={cn(
          "relative mx-auto w-full overflow-x-clip shadow-[0_0_40px_rgba(0,0,0,0.05)]",
          isProductDetail
            ? "max-w-[430px] lg:max-w-none lg:shadow-none"
            : "max-w-screen-sm lg:max-w-none lg:shadow-none",
        )}
      >
        {!isHome ? <Navbar /> : null}
        <main className={cn( "pb-24 lg:pb-0")}>
          {children}
        </main>
        {!isProductDetail ? <BottomNav /> : null}
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
