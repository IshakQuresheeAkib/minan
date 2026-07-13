"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { publicRoutes } from "@/constants/routes";

function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+$/.test(pathname);
}

export function PublicNavbarSlot() {
  const pathname = usePathname();

  return pathname === publicRoutes.home ? null : <Navbar />;
}

export function PublicFooterSlot() {
  const pathname = usePathname();

  if (isProductDetailPath(pathname)) {
    return null;
  }

  return (
    <>
      <Footer />
      <BottomNav />
    </>
  );
}
