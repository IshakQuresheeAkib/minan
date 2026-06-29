"use client";

import { useState } from "react";

import { categorySlugByName } from "@/constants/categories";
import {
  CategoryChips,
  type CategoryChip,
} from "@/features/home/components/CategoryChips";
import { ProductsSection } from "@/features/home/components/ProductsSection";

export function HomeCatalog() {
  const [activeChip, setActiveChip] = useState<CategoryChip>("All");

  const category =
    activeChip === "All" ? undefined : categorySlugByName[activeChip];

  return (
    <>
      <CategoryChips activeChip={activeChip} onChipChange={setActiveChip} />
      <ProductsSection category={category} />
    </>
  );
}
