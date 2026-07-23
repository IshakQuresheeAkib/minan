import { Skeleton } from "@/components/ui/skeleton";
import { RelatedProductsSkeleton } from "@/features/products/components/RelatedProductsSkeleton";

export function ProductDetailsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="relative flex min-h-dvh flex-col overflow-x-hidden font-sans text-foreground lg:min-h-0"
    >
      <span className="sr-only" role="status" aria-live="polite">
        Loading product details
      </span>

      <header className="sticky top-0 z-40 flex items-center justify-between bg-background/95 px-4 pb-3 pt-3 backdrop-blur-md lg:hidden">
        <Skeleton className="size-11 rounded-full shadow-sm" />
        <Skeleton className="size-11 rounded-full shadow-sm" />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-64 lg:px-8 lg:pb-16 lg:pt-6">
        <Skeleton className="mb-4 hidden h-4 w-56 rounded lg:block" />

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:sticky lg:top-6">
            <section className="relative mb-8 lg:mb-0" aria-hidden="true">
              <div className="lg:flex lg:gap-4">
                <div className="mb-5 hidden flex-col gap-3 lg:mb-0 lg:flex">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="size-16 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-[380px] w-full rounded-[32px] shadow-sm lg:h-[520px] lg:flex-1 lg:rounded-2xl" />
              </div>
              <div className="mt-5 flex justify-center gap-2 lg:hidden">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="size-2.5 rounded-full" />
                ))}
              </div>
            </section>
          </div>

          <div aria-hidden="true">
            <div className="mb-4 hidden items-start justify-between gap-4 lg:flex">
              <div className="w-full space-y-3">
                <Skeleton className="h-9 w-3/4 max-w-96 rounded-lg" />
                <Skeleton className="h-7 w-36 rounded-md" />
                <Skeleton className="h-5 w-44 rounded-full" />
              </div>
              <Skeleton className="size-11 shrink-0 rounded-full" />
            </div>

            <Skeleton className="mb-2 h-7 w-3/4 max-w-72 rounded-md lg:hidden" />
            <Skeleton className="mb-6 h-6 w-32 rounded-md lg:hidden" />
            <Skeleton className="mb-6 ml-auto h-4 w-20 rounded lg:ml-0" />

            <div className="space-y-8">
              <SkeletonOptionGroup items={3} />
              <SkeletonOptionGroup items={4} />
            </div>

            <div className="mt-8 hidden items-center gap-3 lg:flex">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>

            <Skeleton className="mt-6 hidden h-12 w-full rounded-full lg:block" />

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-[62px] rounded-2xl" />
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </div>
        </div>

        <RelatedProductsSkeleton />
      </div>

      <footer
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-background/80 px-4 pb-8 pt-4 backdrop-blur-md lg:hidden"
      >
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-32 shrink-0 rounded-full" />
          <Skeleton className="h-14 flex-1 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-full" />
      </footer>

      <div
        aria-hidden="true"
        className="fixed bottom-6 right-6 z-50 hidden items-center gap-3 lg:flex"
      >
        <Skeleton className="h-14 w-40 rounded-full shadow-lg" />
        <Skeleton className="h-14 w-36 rounded-full shadow-lg" />
      </div>

      <div
        className="pointer-events-none fixed bottom-2 left-0 right-0 z-60 flex justify-center lg:hidden"
        aria-hidden="true"
      >
        <div className="h-[5px] w-[134px] rounded-full bg-foreground/30" />
      </div>
    </div>
  );
}

function SkeletonOptionGroup({ items }: { items: number }) {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-20 rounded" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: items }, (_, index) => (
          <Skeleton key={index} className="size-[52px] rounded-full" />
        ))}
      </div>
    </div>
  );
}
