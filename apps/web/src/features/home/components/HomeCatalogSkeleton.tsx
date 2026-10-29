import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

export function HomeCatalogSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading featured catalog"
      className="space-y-6"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64 max-w-full rounded-md" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full rounded" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      </div>

      <div className="mb-6 w-full min-w-0 max-w-full overflow-x-clip">
        <div className="inline-flex min-w-max gap-3 pb-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-9 w-24 shrink-0 rounded-full"
            />
          ))}
        </div>
      </div>

      <ProductGridSkeleton />
    </section>
  );
}
