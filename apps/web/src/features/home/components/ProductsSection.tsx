"use client";

import { useEffect, useRef } from "react";

import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import { useProducts } from "@/features/products/hooks/useProducts";
import { mapProductToCard } from "@/features/products/services/product.service";

type ProductsSectionProps = {
  category?: string;
};

export function ProductsSection({ category }: ProductsSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { products, isLoading, isRefreshing, error, loadMore, hasMore } =
    useProducts({ category });

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const cardProducts = products.map(mapProductToCard);
  const isPaginating = isLoading && !isRefreshing && products.length > 0;

  return (
    <section aria-label="All products" aria-busy={isLoading}>
      {isRefreshing ? (
        <ProductGridSkeleton />
      ) : error ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : (
        <ProductGrid products={cardProducts} />
      )}
      {isPaginating && (
        <p className="py-4 text-center text-sm text-foreground/70">
          Loading products...
        </p>
      )}
      {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}
    </section>
  );
}
