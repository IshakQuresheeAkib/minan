import { Suspense } from "react";
import { connection } from "next/server";

import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <div className="mx-auto w-full max-w-7xl px-2 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <Suspense fallback={<ProductGridSkeleton />}>
          <HomeCatalogContent />
        </Suspense>
      </div>
    </>
  );
}

async function HomeCatalogContent() {
  await connection();

  const [initialProducts, filterOptions] = await Promise.all([
    getCachedProducts({ page: 1, limit: 20 }),
    getCachedProductFilterOptions(),
  ]);

  return (
    <HomeCatalog
      categories={filterOptions.categories}
      initialProducts={initialProducts}
    />
  );
}
