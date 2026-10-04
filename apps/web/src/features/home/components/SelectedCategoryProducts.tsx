"use client";

import { type ReactNode, useEffect } from "react";
import useSWR, { useSWRConfig, unstable_serialize } from "swr";

import { CategoryProductGrid } from "@/features/home/components/ProductsSection";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import {
  getProducts,
  type HomeCatalogProductGroup,
} from "@/features/products/services/product.service";

type SelectedCategory = {
  imageUrl: string;
  name: string;
  slug: string;
};

type SelectedCategoryProductsProps = {
  category: SelectedCategory;
  initialContent: ReactNode;
};

type CachedCategory = { products: HomeCatalogProductGroup["products"]; fetchedAt: number };

export function SelectedCategoryProducts({
  category,
  initialContent,
}: SelectedCategoryProductsProps) {
  const { cache } = useSWRConfig();
  const { data, error, mutate } = useSWR<CachedCategory>(
    ["home-category", category.slug],
    async ([, slug]: readonly [string, string]) => ({
      products: await getProducts({ category: slug }),
      fetchedAt: Date.now(),
    }),
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false },
  );

  useEffect(() => {
    const refreshIfStale = () => {
      const cached = cache.get(unstable_serialize(["home-category", category.slug]))?.data as CachedCategory | undefined;
      if (cached && Date.now() - cached.fetchedAt >= 300_000) {
        void mutate().catch(() => undefined);
      }
    };
    refreshIfStale();
    window.addEventListener("focus", refreshIfStale);
    window.addEventListener("online", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      window.removeEventListener("online", refreshIfStale);
    };
  }, [cache, category.slug, mutate]);

  return (
    <div className="space-y-4">
      {data?.products ? (
      <CategoryProductGrid
        group={{
          category: {
            image_url: category.imageUrl,
            name: category.name,
            slug: category.slug,
          },
          products: data.products,
        }}
        showViewMore={false}
      />
      ) : initialContent}
      {error ? (
        <div
          className="min-h-5 text-center text-sm text-foreground/70"
          aria-live="polite"
        >
          <p>
            {error instanceof Error ? error.message : "Failed to load all products"}.{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-foreground/75 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              onClick={() => { void mutate().catch(() => undefined); }}
            >
              Try again
            </button>
          </p>
        </div>
      ) : !data ? (
        <SelectedCategoryProductSkeletons categoryName={category.name} />
      ) : null}
    </div>
  );
}

function SelectedCategoryProductSkeletons({
  categoryName,
}: {
  categoryName: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={`Loading more ${categoryName} products`}
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
