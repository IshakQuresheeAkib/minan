import { ProductCatalogSkeleton } from "@/features/products/components/ProductCatalogSkeleton";

export default function ProductsLoading() {
  return (
    <section className="mx-auto w-full max-w-11/12 py-10 2xl:px-12">
      <div className="mb-8 flex flex-col gap-2">
        <div className="minan-skeleton h-9 w-36 rounded" />
        <div className="minan-skeleton h-4 w-full max-w-2xl rounded" />
        <div className="minan-skeleton h-4 w-3/4 max-w-xl rounded" />
      </div>
      <ProductCatalogSkeleton />
    </section>
  );
}
