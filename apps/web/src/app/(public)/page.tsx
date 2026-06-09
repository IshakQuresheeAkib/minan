import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <FeaturedProducts />
    </>
  );
}
