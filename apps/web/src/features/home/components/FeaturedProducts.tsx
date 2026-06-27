import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  getProducts,
  mapProductToCard,
} from "@/features/products/services/product.service";

export async function FeaturedProducts() {
  const { data } = await getProducts({ featured: true });

  return (
    <section aria-label="Featured products">
      <ProductGrid products={data.map(mapProductToCard)} />
    </section>
  );
}
