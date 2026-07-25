import { Skeleton } from "@/components/ui/skeleton";
import { productCardShellClassName } from "@/features/products/components/product-card.styles";
import { cn } from "@/lib/utils";

type ProductCardSkeletonProps = {
  className?: string;
};

export function ProductCardSkeleton({
  className,
}: ProductCardSkeletonProps) {
  return (
    <article
      aria-hidden="true"
      className={cn(productCardShellClassName, className)}
    >
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="flex flex-1 flex-col p-2 sm:p-3">
        <div className="min-h-7 space-y-2">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-4 w-24 max-w-full rounded" />
          </div>
          <Skeleton className="size-8 shrink-0 rounded-full sm:size-10" />
        </div>
      </div>
    </article>
  );
}
