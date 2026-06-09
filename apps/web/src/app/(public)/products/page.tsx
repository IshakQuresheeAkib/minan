import { ProductGrid } from "@/features/products/components/ProductGrid";

export const metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Premium daily wear selected for fast browsing and easy ordering.
        </p>
      </div>
      <ProductGrid />
    </section>
  );
}
