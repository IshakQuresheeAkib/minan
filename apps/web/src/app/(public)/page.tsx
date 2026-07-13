import { Suspense } from "react";
import { connection } from "next/server";

import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import { getCachedProducts } from "@/features/products/services/product.cache";

export default async function HomePage() {
  await connection();

  return (
    <>
      <HeroCarousel />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <Suspense fallback={<ProductGridSkeleton />}>
          <HomeCatalogContent />
        </Suspense>
      </div>
    </>
  );
}

async function HomeCatalogContent() {
  const initialProducts = await getCachedProducts({ page: 1, limit: 20 });

  return <HomeCatalog initialProducts={initialProducts} />;
}
