export default function PublicLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <span className="sr-only">Loading page</span>

      <div
        aria-hidden="true"
        className="motion-safe:animate-pulse motion-reduce:animate-none"
      >
        <div className="mb-8 max-w-2xl space-y-3">
          <div className="h-3 w-24 rounded-full bg-primary/35" />
          <div className="h-9 w-48 rounded-lg bg-background" />
          <div className="h-4 w-full rounded bg-background" />
          <div className="h-4 w-4/5 rounded bg-background" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-secondary bg-background p-3 sm:grid-cols-[104px_1fr]"
              >
                <div className="aspect-square rounded-xl bg-background" />
                <div className="space-y-3 py-2">
                  <div className="h-5 w-3/4 rounded bg-background" />
                  <div className="h-4 w-1/2 rounded bg-background" />
                  <div className="h-4 w-1/3 rounded bg-background" />
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-secondary bg-background p-5">
            <div className="h-6 w-36 rounded bg-background" />
            <div className="mt-5 h-4 w-full rounded bg-background" />
            <div className="mt-3 h-4 w-3/4 rounded bg-background" />
            <div className="mt-6 h-12 w-full rounded-full bg-foreground/15" />
          </div>
        </div>
      </div>
    </section>
  );
}
