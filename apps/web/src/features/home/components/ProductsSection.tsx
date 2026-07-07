"use client";

import { useEffect, useRef } from "react";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/schemas/product.schema";
import { mapProductToCard } from "@/features/products/services/product.service";
import { cn } from "@/lib/utils";

type ProductsSectionProps = {
  category?: string;
  initialProducts?: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
};

export function ProductsSection({
  category,
  initialProducts,
}: ProductsSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialData = category ? undefined : initialProducts;
  const { products, isLoading, isRefreshing, error, loadMore, hasMore } =
    useProducts({ category, initialData });

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
  const hasProducts = cardProducts.length > 0;
  const showInitialSkeleton = isRefreshing && !hasProducts;
  const showRefreshingProducts = isRefreshing && hasProducts;
  const isPaginating = isLoading && !isRefreshing && products.length > 0;

  return (
    <section aria-label="All products" aria-busy={isLoading}>
      {showRefreshingProducts && (
        <div
          className="mb-3 h-1 overflow-hidden rounded-full bg-primary/15"
          aria-hidden="true"
        >
          <span className="block h-full w-1/3 rounded-full bg-primary/80 animate-pulse" />
        </div>
      )}
      {showInitialSkeleton ? (
        <ProductGridSkeleton />
      ) : error && !hasProducts ? (
        <p className="py-10 text-center text-sm text-destructive">{error}</p>
      ) : (
        <div
          className={cn(
            "transition-opacity duration-200",
            showRefreshingProducts && "opacity-60",
          )}
        >
          <ProductGrid products={cardProducts} />
        </div>
      )}
      {error && hasProducts && (
        <p className="py-3 text-center text-sm text-destructive">{error}</p>
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
