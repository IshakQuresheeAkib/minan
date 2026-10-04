"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";

import { ProductDetails } from "@/features/products/components/ProductDetails";
import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";
import { RelatedProductsSkeleton } from "@/features/products/components/RelatedProductsSkeleton";
import type { ProductDetail } from "@/features/products/schemas/product.schema";

export function ProductDetailsPending() {
  return (
    <>
      <p role="status" className="sr-only">Loading product details.</p>
      <Suspense fallback={<ProductDetailsSkeleton />}><CachedProductDetails /></Suspense>
    </>
  );
}

function CachedProductDetails() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const { data } = useSWR<ProductDetail>(slug ? ["product-detail", slug] : null, null);
  if (!data) return <ProductDetailsSkeleton />;
  return <ProductDetails product={data} routePending><RelatedProductsSkeleton /></ProductDetails>;
}
