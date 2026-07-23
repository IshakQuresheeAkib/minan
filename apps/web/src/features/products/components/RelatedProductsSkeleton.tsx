import { Skeleton } from "@/components/ui/skeleton";

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
          <article
            key={index}
            className="overflow-hidden rounded-2xl border border-secondary/70 bg-background shadow-[0_8px_24px_rgba(151,72,34,0.05)]"
          >
            <Skeleton className="aspect-square w-full rounded-none ring-0" />
            <div className="p-2 sm:p-3">
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="mt-2 h-4 w-3/5 rounded" />
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-24 max-w-full rounded" />
                </div>
                <Skeleton className="size-8 shrink-0 rounded-full sm:size-10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
