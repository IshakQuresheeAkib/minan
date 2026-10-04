import { ProductCatalogPending } from "@/features/products/components/CachedProductCatalog";

export default function ProductsLoading() {
  return (
    <section className="mx-auto w-full max-w-11/12 py-10 2xl:px-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Products</h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground/70">
          Premium daily wear selected for fast browsing and easy ordering.
        </p>
      </div>
      <ProductCatalogPending />
    </section>
  );
}
