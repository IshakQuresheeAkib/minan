export default function PublicLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <span className="sr-only">Loading page</span>

      <div aria-hidden="true">
        <div className="mb-8 max-w-2xl space-y-3">
          <div className="minan-skeleton h-3 w-24 rounded-full" />
          <div className="minan-skeleton h-9 w-48 rounded-lg" />
          <div className="minan-skeleton h-4 w-full rounded" />
          <div className="minan-skeleton h-4 w-4/5 rounded" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-foreground/10 bg-background p-3 sm:grid-cols-[104px_1fr]"
              >
                <div className="minan-skeleton aspect-square rounded-xl" />
                <div className="space-y-3 py-2">
                  <div className="minan-skeleton h-5 w-3/4 rounded" />
                  <div className="minan-skeleton h-4 w-1/2 rounded" />
                  <div className="minan-skeleton h-4 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-foreground/10 bg-background p-5">
            <div className="minan-skeleton h-6 w-36 rounded" />
            <div className="minan-skeleton mt-5 h-4 w-full rounded" />
            <div className="minan-skeleton mt-3 h-4 w-3/4 rounded" />
            <div className="minan-skeleton mt-6 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
