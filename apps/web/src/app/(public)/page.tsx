import { CategoryChips } from "@/features/home/components/CategoryChips";
import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { SearchBar } from "@/features/home/components/SearchBar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SearchBar />
      <HeroCarousel />
      <CategoryChips />
      <FeaturedProducts />
    </>
  );
}
