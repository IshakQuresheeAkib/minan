export function RelatedProductsSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading related products"
      className="mt-12 border-t border-border pt-10 lg:mt-16 lg:pt-12"
    >
      <div className="mb-6 h-6 w-44 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-border bg-card p-3"
          >
            <div className="mb-3 aspect-4/5 rounded-xl bg-muted" />
            <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
