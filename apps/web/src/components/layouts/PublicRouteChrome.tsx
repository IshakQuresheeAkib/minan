"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/shared/bottom-nav";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+$/.test(pathname);
}

export function PublicNavbarSlot() {
  return <Navbar />;
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
