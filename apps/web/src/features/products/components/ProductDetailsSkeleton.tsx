import { RelatedProductsSkeleton } from "@/features/products/components/RelatedProductsSkeleton";

export function ProductDetailsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product details"
      className="relative flex min-h-dvh flex-col overflow-x-hidden font-sans text-foreground lg:min-h-0"
    >
      <header className="sticky top-0 z-40 flex items-center justify-between bg-background/95 px-4 pb-3 pt-3 backdrop-blur-md lg:hidden">
        <div className="size-11 animate-pulse rounded-full bg-muted" />
        <div className="size-11 animate-pulse rounded-full bg-muted" />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-36 lg:px-8 lg:pb-16 lg:pt-6">
        <div className="mb-4 hidden h-4 w-56 animate-pulse rounded bg-muted lg:block" />

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:sticky lg:top-6">
            <section className="relative mb-8 lg:mb-0">
              <div className="lg:flex lg:gap-4">
                <div className="mb-5 hidden flex-col gap-3 lg:mb-0 lg:flex">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
                      className="size-16 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
                <div className="h-[380px] w-full animate-pulse rounded-[32px] bg-muted lg:h-[520px] lg:flex-1 lg:rounded-2xl" />
              </div>
              <div className="mt-5 flex justify-center gap-2 lg:hidden">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="size-2.5 animate-pulse rounded-full bg-muted"
                  />
                ))}
              </div>
            </section>
          </div>

          <div>
            <div className="mb-4 hidden items-start justify-between gap-4 lg:flex">
              <div className="space-y-3">
                <div className="h-9 w-72 animate-pulse rounded bg-muted" />
                <div className="h-8 w-36 animate-pulse rounded bg-muted" />
              </div>
              <div className="size-11 animate-pulse rounded-full bg-muted" />
            </div>

            <div className="mb-2 h-7 w-64 animate-pulse rounded bg-muted lg:hidden" />
            <div className="mb-6 h-6 w-28 animate-pulse rounded bg-muted lg:hidden" />
            <div className="mb-6 ml-auto h-9 w-28 animate-pulse rounded-full bg-muted lg:ml-0" />

            <div className="space-y-6">
              <SkeletonOptionGroup rows={3} />
              <SkeletonOptionGroup rows={4} />
            </div>

            <div className="mt-8 hidden items-center gap-3 lg:flex">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-12 w-32 animate-pulse rounded-full bg-muted" />
            </div>

            <div className="mt-6 hidden h-12 w-full animate-pulse rounded-full bg-muted lg:block" />

            <div className="mt-8 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        <RelatedProductsSkeleton />
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-background/80 px-4 pb-8 pt-4 backdrop-blur-md lg:hidden">
        <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-14 flex-1 animate-pulse rounded-full bg-muted" />
        </div>
      </footer>
    </div>
  );
}

function SkeletonOptionGroup({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="h-10 w-20 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
