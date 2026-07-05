"use client";

import { ArrowRight, MessageCircle, RefreshCw, Truck } from "lucide-react";
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

const trustItems = [
  {
    icon: Truck,
    label: "Free delivery Sylhet",
  },
  {
    icon: RefreshCw,
    label: "Easy exchange",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp ordering",
  },
] as const;

export function HomeCatalog({ initialProducts }: HomeCatalogProps) {
  const [activeChip, setActiveChip] = useState<CategoryChip>("All");

  const category =
    activeChip === "All" ? undefined : categorySlugByName[activeChip];
  const activeLabel = activeChip === "All" ? "Latest pieces" : activeChip;

  return (
    <section className="space-y-6" aria-labelledby="home-catalog-title">
      <div className="space-y-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
              Shop MINAN
            </p>
            <h1
              id="home-catalog-title"
              className="mt-2 font-display text-2xl font-bold tracking-normal text-foreground sm:text-3xl"
            >
              Fresh styles, ready to order
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/70">
              Browse the latest pieces by category, then cart or order from the
              product page when you find the right fit.
            </p>
          </div>
        </div>

        <ul className="grid gap-2 sm:grid-cols-3">
          {trustItems.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_8px_22px_rgba(151,72,34,0.04)]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {label}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {activeLabel}
            </p>
            <p className="text-xs text-foreground/65">
              Filter the homepage feed or open the full catalog.
            </p>
          </div>
          <Link
            href={publicRoutes.products}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
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
