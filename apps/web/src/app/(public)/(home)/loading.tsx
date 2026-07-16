import { HeroFirstSlideShell } from "@/features/home/components/HeroFirstSlideShell";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

export default function HomeLoading() {
  return (
    <>
      <HeroFirstSlideShell />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <ProductGridSkeleton />
      </div>
    </>
  );
}
