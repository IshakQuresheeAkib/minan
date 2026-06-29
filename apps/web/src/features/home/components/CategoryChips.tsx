"use client";

import { productCategories } from "@/constants/categories";
import { cn } from "@/lib/utils";

const chips = ["All", ...productCategories] as const;

export type CategoryChip = (typeof chips)[number];

type CategoryChipsProps = {
  activeChip: CategoryChip;
  onChipChange: (chip: CategoryChip) => void;
};

export function CategoryChips({
  activeChip,
  onChipChange,
}: CategoryChipsProps) {
  return (
    <section
      aria-label="Categories"
      className="-mx-4 mb-12 overflow-x-auto hide-scrollbar px-4"
    >
      <div className="flex min-w-max gap-3 pb-2">
        {chips.map((chip) => {
          const isActive = activeChip === chip;

          return (
            <button
              key={chip}
              type="button"
              onClick={() => onChipChange(chip)}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold tracking-wide transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </section>
  );
}
