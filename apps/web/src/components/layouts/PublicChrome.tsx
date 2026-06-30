"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Navbar } from "@/components/shared/navbar";
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

  return (
    <div className="min-h-dvh bg-background">
      <div
        className={cn(
          "relative mx-auto w-full shadow-[0_0_40px_rgba(0,0,0,0.05)]",
          isProductDetail
            ? "max-w-[430px]"
            : "max-w-screen-sm lg:max-w-none lg:shadow-none",
        )}
      >
        {!isProductDetail ? <Navbar /> : null}
        <main
          className={cn(
            isProductDetail
              ? "px-0 pb-0 pt-0"
              : "px-4 pb-28 pt-3 lg:px-0 lg:pb-0 lg:pt-0",
          )}
        >
          {children}
        </main>
        {!isProductDetail ? <BottomNav /> : null}
      </div>
    </div>
  );
}
