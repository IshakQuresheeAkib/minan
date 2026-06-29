import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { SearchBar } from "@/features/home/components/SearchBar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SearchBar />
      <HeroCarousel />
      <HomeCatalog />
    </>
  );
}
