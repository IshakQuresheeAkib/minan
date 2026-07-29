import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import { cn } from "@/lib/utils";

const SKELETON_COUNT = 8;

type ProductGridSkeletonProps = {
  className?: string;
  compact?: boolean;
  count?: number;
};

export function ProductGridSkeleton({
  className,
  compact = false,
  count = SKELETON_COUNT,
}: ProductGridSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className={cn(
        "grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4",
        compact ? "min-h-0" : "min-h-[480px]",
        className,
      )}
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
