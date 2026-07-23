import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";

export function RelatedProductsSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mt-12 border-t border-secondary pt-10 lg:mt-16 lg:pt-12"
    >
      <span className="sr-only" role="status" aria-live="polite">
        Loading related products
      </span>
      <Skeleton className="mb-6 h-6 w-44 rounded-md" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
