"use client";

import { useEffect, useRef } from "react";

import { ProductGrid } from "@/features/products/components/ProductGrid";
import { useProducts } from "@/features/products/hooks/useProducts";
import { mapProductToCard } from "@/features/products/services/product.service";

export function ProductsSection() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { products, isLoading, loadMore, hasMore } = useProducts();

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

  return (
    <section aria-label="All products">
      <ProductGrid products={products.map(mapProductToCard)} />
      {isLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Loading products...
        </p>
      )}
      {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}
    </section>
  );
}
