import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";

const SKELETON_COUNT = 8;

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({
  count = SKELETON_COUNT,
}: ProductGridSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="grid min-h-[480px] grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton
          key={index}
          className={index > 5 ? "hidden xl:flex" : undefined}
        />
      ))}
    </div>
  );
}
