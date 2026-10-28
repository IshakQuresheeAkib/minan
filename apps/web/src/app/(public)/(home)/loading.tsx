import { HeroFirstSlideShell } from "@/features/home/components/HeroFirstSlideShell";
import { HomeCatalogSkeleton } from "@/features/home/components/HomeCatalogSkeleton";

export default function HomeLoading() {
  return (
    <>
      <HeroFirstSlideShell />
      <div className="mx-auto w-full max-w-11/12 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <HomeCatalogSkeleton />
      </div>
    </>
  );
}
