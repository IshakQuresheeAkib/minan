"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { categorySlugByName } from "@/constants/categories";
import { publicRoutes } from "@/constants/routes";
import {
  CategoryChips,
  type CategoryChip,
} from "@/features/home/components/CategoryChips";
import { ProductsSection } from "@/features/home/components/ProductsSection";
import type { Product } from "@/features/products/schemas/product.schema";

type HomeCatalogProps = {
  initialProducts?: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
};

export function HomeCatalog({ initialProducts }: HomeCatalogProps) {
  const [activeChip, setActiveChip] = useState<CategoryChip>("All");

  const category =
    activeChip === "All" ? undefined : categorySlugByName[activeChip];
  const activeLabel = activeChip === "All" ? "FEATURED CATEGORIES" : activeChip;

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
      <CategoryChips activeChip={activeChip} onChipChange={setActiveChip} />
      <ProductsSection category={category} initialProducts={initialProducts} />
    </section>
  );
}
