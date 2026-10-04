"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CategoryChipsProps = {
  categories: readonly {
    name: string;
    slug: string;
  }[];
  activeCategorySlug?: string;
  pendingCategorySlug?: string;
  onCategoryChange: (slug?: string) => void;
};

export function CategoryChips({
  categories,
  activeCategorySlug,
  pendingCategorySlug,
  onCategoryChange,
}: CategoryChipsProps) {
  return (
    <section
      aria-label="Categories"
      aria-busy={Boolean(pendingCategorySlug)}
      className="mb-6 w-full min-w-0 max-w-full overflow-x-clip"
    >
      <div
        className="hide-scrollbar w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 touch-auto select-none [-webkit-overflow-scrolling:touch]"
      >
        <div className="inline-flex min-w-max gap-3">
          {[{ name: "All", slug: undefined }, ...categories].map((category) => {
            const isActive = activeCategorySlug === category.slug;
            const isPending =
              pendingCategorySlug !== undefined &&
              pendingCategorySlug === category.slug;
            return (
              <button
                key={category.slug ?? "all"}
                type="button"
                onClick={() => onCategoryChange(category.slug)}
                aria-label={
                  isPending ? `Loading ${category.name} products` : undefined
                }
                className={cn(
                  "relative inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none",
                  isActive
                    ? "bg-foreground text-primary"
                    : "border border-secondary bg-background text-foreground/85 hover:border-primary hover:text-foreground",
                )}
              >
                {category.name}
                {isPending ? (
                  <Loader2
                    className="absolute left-2 size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
