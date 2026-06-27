"use client";

import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  price: number;
  colors: readonly ProductColorClass[];
};

type ProductColorClass =
  | "bg-primary"
  | "bg-secondary"
  | "bg-accent"
  | "bg-muted-foreground"
  | "bg-foreground"
  | "bg-chart-2"
  | "bg-chart-5";

type ProductCardProps = {
  product: ProductCardData;
};

export function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-[0_8px_24px_rgba(151,72,34,0.04)]">
      <div className="relative mb-3 aspect-4/5 overflow-hidden rounded-xl bg-muted">
        <div
          className="absolute inset-0 bg-linear-to-b from-muted to-input"
          aria-hidden="true"
        />
        <Link
          href={`/products/${product.slug}`}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-sm backdrop-blur-sm transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
          Shop
        </Link>
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => setIsFavorite((current) => !current)}
          className="absolute bottom-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-card/90 text-primary shadow-sm backdrop-blur-sm transition-colors hover:text-primary"
        >
          <Heart
            className={cn("size-4", isFavorite && "fill-primary")}
            aria-hidden="true"
          />
        </button>
      </div>
      <div>
        <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="mb-2 truncate text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            BDT {product.price}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {product.colors.map((color) => (
              <span
                key={color}
                className={`size-3 rounded-full border border-border ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
