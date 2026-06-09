import { ProductGrid } from "@/features/products/components/ProductGrid";

export function FeaturedProducts() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">Featured</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">Popular Picks</h2>
        </div>
      </div>
      <ProductGrid />
    </section>
  );
}
