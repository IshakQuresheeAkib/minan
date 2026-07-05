import { ProductCatalogSkeleton } from "@/features/products/components/ProductCatalogSkeleton";

export default function ProductsLoading() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <ProductCatalogSkeleton />
    </section>
  );
}
