import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  getProducts,
  mapProductToCard,
} from "@/features/products/services/product.service";

export const metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { data } = await getProducts();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Premium daily wear selected for fast browsing and easy ordering.
        </p>
      </div>
      <ProductGrid products={data.map(mapProductToCard)} />
    </section>
  );
}
