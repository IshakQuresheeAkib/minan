import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

export default function PublicLoading() {
  return (
    <>
      <section
        aria-hidden="true"
        className="relative overflow-hidden border-b border-border/60"
      >
        <div className="h-16 animate-pulse bg-foreground/90" />
        <div className="h-[min(600px,calc(100svh-5rem))] min-h-[540px] animate-pulse bg-muted sm:min-h-[600px]" />
      </section>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pt-8 pb-10 sm:px-6 lg:px-10 lg:py-12">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>
        <ProductGridSkeleton />
      </div>
    </>
  );
}
