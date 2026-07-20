"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { publicRoutes } from "@/constants/routes";
import { CategoryChips } from "@/features/home/components/CategoryChips";
import { ProductsSection } from "@/features/home/components/ProductsSection";
import type { Product } from "@/features/products/schemas/product.schema";
import type { ProductFilterOptions } from "@/features/products/services/product.service";

type HomeCatalogProps = {
  categories: ProductFilterOptions["categories"];
  initialProducts?: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
};

export function HomeCatalog({ categories, initialProducts }: HomeCatalogProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>();
  const activeCategory = categories.find(
    (candidate) => candidate.slug === activeCategorySlug,
  );
  const activeLabel = activeCategory?.name ?? "FEATURED CATEGORIES";

  return (
    <section className="space-y-6" aria-labelledby="home-catalog-title">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {activeLabel}
            </p>
            <p className="text-sm text-foreground/70">
              Browse the latest pieces by category, then cart or order from the
              product page when you find the right fit.
            </p>
          </div>
          <Link
            href={publicRoutes.products}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
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
      <ProductsSection
        categories={categories}
        category={activeCategorySlug}
        initialProducts={initialProducts}
      />
    </section>
  );
}
