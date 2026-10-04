import type { ReactNode } from "react";

export function RouteDataSkeleton({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold tracking-normal">{title}</h1>
      {children ?? (
        <div aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`} className="space-y-4">
          <div aria-hidden="true" className="minan-skeleton h-28 rounded-md" />
          <div aria-hidden="true" className="minan-skeleton h-28 rounded-md" />
          <span className="sr-only" role="status">Loading…</span>
        </div>
      )}
    </section>
  );
}
