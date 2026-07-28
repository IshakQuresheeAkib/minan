import { Suspense } from "react";
import { connection } from "next/server";

import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { HeroFirstSlideShell } from "@/features/home/components/HeroFirstSlideShell";
import { fallbackHomeBanners } from "@/features/home/data/home-banners";
import { getCachedHomeBanners } from "@/features/home/services/home-banner.cache";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import { getCachedHomeCatalog } from "@/features/products/services/product.cache";

export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">
        MINAN premium fashion clothing in Bangladesh
      </h1>
      <Suspense fallback={<HeroFirstSlideShell />}>
        <HomeHeroContent />
      </Suspense>
      <div className="mx-auto w-full max-w-11/12 px-2 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <Suspense fallback={<ProductGridSkeleton />}>
          <HomeCatalogContent />
        </Suspense>
      </div>
    </>
  );
}

async function HomeHeroContent() {
  await connection();

  let banners = fallbackHomeBanners;

  try {
    const managedBanners = await getCachedHomeBanners();
    if (managedBanners.length > 0) {
      banners = managedBanners;
    } else {
      console.error("Homepage banner API returned an empty banner set");
    }
  } catch (error) {
    console.error("Failed to load homepage banners", error);
  }

  return <HeroCarousel banners={banners} />;
}

async function HomeCatalogContent() {
  await connection();

  const categoryGroups = await getCachedHomeCatalog();

  return <HomeCatalog categoryGroups={categoryGroups} />;
}
