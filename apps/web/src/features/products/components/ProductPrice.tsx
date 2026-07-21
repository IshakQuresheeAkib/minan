import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

type ProductPriceProps = {
  className?: string;
  discount: number;
  originalPrice: number;
  price: number;
  showBadge?: boolean;
  showOriginalPrice?: boolean;
  size?: "sm" | "md" | "lg";
};

const currentPriceClasses = {
  sm: "text-sm sm:text-base",
  md: "text-base",
  lg: "text-2xl",
} as const;

const originalPriceClasses = {
  sm: "text-[11px] sm:text-xs",
  md: "text-xs",
  lg: "text-sm",
} as const;

function formatCurrency(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

export function ProductPrice({
  className,
  discount,
  originalPrice,
  price,
  showBadge = true,
  showOriginalPrice = true,
  size = "sm",
}: ProductPriceProps) {
  const hasDiscount = discount > 0 && price < originalPrice;
  const savings = originalPrice - price;

  return (
    <div className={className}>
      <span
        className={cn(
          "font-bold text-foreground",
          currentPriceClasses[size],
        )}
      >
        {formatCurrency(price)}
      </span>
      {hasDiscount && showOriginalPrice ? (
        <del
          className={cn(
            "text-foreground/60 decoration-foreground/45",
            originalPriceClasses[size],
          )}
        >
          {formatCurrency(originalPrice)}
        </del>
      ) : null}
      {hasDiscount && showBadge ? (
        <p className="mt-4 flex w-fit basis-full items-center gap-1 rounded-full border border-primary/25 bg-primary/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-foreground uppercase">
          <Tag className="size-3" aria-hidden="true" />
          Save Tk {savings.toLocaleString("en-BD")} · {discount}% off
        </p>
      ) : null}
    </div>
  );
}
