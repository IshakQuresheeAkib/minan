import { cn } from "@/lib/utils";

type ProductPriceProps = {
  className?: string;
  discount: number;
  originalPrice: number;
  price: number;
  showOriginalPrice?: boolean;
  size?: "sm" | "md" | "lg";
};

const currentPriceClasses = {
  sm: "text-xs xs:text-sm sm:text-base",
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
  showOriginalPrice = true,
  size = "sm",
}: ProductPriceProps) {
  const hasDiscount = discount > 0 && price < originalPrice;

  return (
    <div className={cn(`min-w-0 flex flex-wrap items-center gap-1 sm:gap-2 ${className}`)}>
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
    </div>
  );
}
