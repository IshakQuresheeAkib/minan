import { HomeCatalog } from "@/features/home/components/HomeCatalog";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { getProducts } from "@/features/products/services/product.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialProducts = await getProducts({ page: 1, limit: 20 });

  return (
    <>
      <HeroCarousel />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <HomeCatalog initialProducts={initialProducts} />
      </div>
    </>
  );
}
