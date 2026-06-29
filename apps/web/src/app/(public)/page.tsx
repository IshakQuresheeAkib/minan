import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { SearchBar } from "@/features/home/components/SearchBar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <div className="hidden lg:block">
        <SearchBar />
      </div>
      <HeroCarousel />
      <div className="lg:mx-auto lg:max-w-7xl lg:px-10 lg:py-12">
        <HomeCatalog />
      </div>
    </>
  );
}
