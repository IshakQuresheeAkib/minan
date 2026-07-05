"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { Toaster } from "@/components/ui/sonner";
import { publicRoutes } from "@/constants/routes";

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
      <div className="relative mx-auto w-full overflow-x-clip shadow-[0_0_40px_rgba(0,0,0,0.05)]">
        {!isHome ? <Navbar /> : null}
        <main className="pb-24 lg:pb-0">{children}</main>
        {!isProductDetail ? <Footer /> : null}
        {!isProductDetail ? <BottomNav /> : null}
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
