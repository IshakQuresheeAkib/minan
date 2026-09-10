"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Children, type ReactNode, useState } from "react";

import { publicRoutes } from "@/constants/routes";
import { CategoryChips } from "@/features/home/components/CategoryChips";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";

export type HomeCatalogCategory = {
  hasProducts: boolean;
  imageUrl: string;
  name: string;
  slug: string;
};

type HomeCatalogClientProps = {
  categories: readonly HomeCatalogCategory[];
  children: ReactNode;
};

const SelectedCategoryProducts = dynamic(
  () =>
    import("@/features/home/components/SelectedCategoryProducts").then(
      (module) => module.SelectedCategoryProducts,
    ),
  {
    loading: () => <SelectedCategoryLoading />,
  },
);

export function HomeCatalogClient({
  categories,
  children,
}: HomeCatalogClientProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>();
  const categorySlots = Children.toArray(children);
  const activeCategoryIndex = categories.findIndex(
    (category) => category.slug === activeCategorySlug,
  );
  const activeCategory =
    activeCategoryIndex >= 0 ? categories[activeCategoryIndex] : undefined;
  const activeContent =
    activeCategoryIndex >= 0 ? categorySlots[activeCategoryIndex] : undefined;
  const visibleCategorySlots = categories.flatMap((category, index) =>
    category.hasProducts && categorySlots[index] ? [categorySlots[index]] : [],
  );

  return (
    <section className="space-y-6" aria-labelledby="home-catalog-title">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="home-catalog-title"
              className="text-2xl font-bold text-foreground"
            >
              {activeCategory?.name ?? "FEATURED CATEGORIES"}
            </h2>
            <p className="text-sm text-foreground/70">
              Browse the latest pieces by category, then cart or order from the
              product page when you find the right fit.
            </p>
          </div>
          <Link
            href={publicRoutes.products}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-foreground/75 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
          >
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <CategoryChips
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        onCategoryChange={setActiveCategorySlug}
      />
      {activeCategory ? (
        activeCategory.hasProducts ? (
          <SelectedCategoryProducts
            key={activeCategory.slug}
            category={activeCategory}
            initialContent={activeContent}
          />
        ) : (
          activeContent
        )
      ) : visibleCategorySlots.length > 0 ? (
        <section
          className="space-y-10 xl:space-y-12"
          aria-label="Products by category"
        >
          {visibleCategorySlots}
        </section>
      ) : (
        <p className="py-10 text-center text-sm text-foreground/70">
          No products available yet.
        </p>
      )}
    </section>
  );
}

function SelectedCategoryLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading selected category products"
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
