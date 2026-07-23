const SKELETON_COUNT = 8;

export function ProductGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="grid min-h-[480px] grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className={`rounded-2xl border border-foreground/10 bg-background p-3 ${
            index > 5 ? "hidden xl:block" : ""
          }`}
        >
          <div className="minan-skeleton mb-3 aspect-4/5 rounded-xl" />
          <div className="minan-skeleton mb-2 h-4 w-3/4 rounded" />
          <div className="minan-skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}
