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
        <div className="minan-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] space-y-6 overflow-y-auto overscroll-y-contain rounded-2xl border border-foreground/10 bg-background/80 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="minan-skeleton h-5 w-20 rounded" />
              <div className="minan-skeleton h-3 w-28 rounded" />
            </div>
            <div className="minan-skeleton size-9 rounded-full" />
          </div>

          {FILTER_GROUPS.map((group) => (
            <div
              key={group.titleWidth}
              className="space-y-3 border-t border-foreground/10 pt-4"
            >
              <div
                className={`minan-skeleton h-4 rounded ${group.titleWidth}`}
              />
              <div className="space-y-3">
                {group.rows.map((rowWidth, index) => (
                  <div
                    key={`${rowWidth}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div
                      className={`minan-skeleton h-4 rounded ${rowWidth}`}
                    />
                    <div className="minan-skeleton size-5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-background/80 p-3 shadow-[0_12px_36px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="minan-skeleton h-4 w-24 rounded" />
            <div className="minan-skeleton h-3 w-40 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="minan-skeleton h-10 w-24 rounded-full lg:hidden" />
            <div className="minan-skeleton h-10 w-44 rounded-full" />
          </div>
        </div>

        <ProductGridSkeleton />
      </div>
    </div>
  );
}
