import { CategoryChips } from "@/features/home/components/CategoryChips";
import { ProductsSection } from "@/features/home/components/ProductsSection";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { SearchBar } from "@/features/home/components/SearchBar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SearchBar />
      <HeroCarousel />
      <CategoryChips />
      <ProductsSection />
    </>
  );
}
