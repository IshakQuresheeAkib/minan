"use client";

import Link, { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";
import type { ComponentProps } from "react";

import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";

type ProductDetailsLinkProps = ComponentProps<typeof Link>;

export function ProductDetailsLink({
  children,
  ...props
}: ProductDetailsLinkProps) {
  return (
    <Link {...props}>
      {children}
      <PendingProductDetailsSkeleton />
    </Link>
  );
}

function PendingProductDetailsSkeleton() {
  const { pending } = useLinkStatus();

  if (!pending || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <ProductDetailsSkeleton />
    </div>,
    document.body,
  );
}
