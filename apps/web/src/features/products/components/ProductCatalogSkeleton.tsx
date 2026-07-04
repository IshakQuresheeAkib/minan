import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

const FILTER_GROUPS = [
  { titleWidth: "w-24", rows: ["w-32", "w-28", "w-36"] },
  { titleWidth: "w-16", rows: ["w-20", "w-24", "w-20", "w-28"] },
  { titleWidth: "w-14", rows: ["w-12", "w-12", "w-12"] },
];

export function ProductCatalogSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product catalog"
      className="grid gap-6 lg:grid-cols-[280px_1fr]"
    >
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-6 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-[0_16px_48px_rgba(151,72,34,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="size-9 animate-pulse rounded-full bg-muted" />
          </div>

          {FILTER_GROUPS.map((group) => (
            <div
              key={group.titleWidth}
              className="space-y-3 border-t border-border/70 pt-4"
            >
              <div
                className={`h-4 animate-pulse rounded bg-muted ${group.titleWidth}`}
              />
              <div className="space-y-3">
                {group.rows.map((rowWidth, index) => (
                  <div
                    key={`${rowWidth}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div
                      className={`h-4 animate-pulse rounded bg-muted ${rowWidth}`}
                    />
                    <div className="size-5 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-[0_12px_36px_rgba(151,72,34,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted lg:hidden" />
            <div className="h-10 w-44 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        <ProductGridSkeleton />
      </div>
    </div>
  );
}
