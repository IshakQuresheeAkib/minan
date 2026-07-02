"use client";

import { cn } from "@/lib/utils";

const colorSwatchMap: Record<string, string> = {
  Black: "bg-foreground",
  White: "bg-card border border-border",
  Blue: "bg-primary",
  Navy: "bg-primary",
  Red: "bg-destructive",
  Gold: "bg-secondary",
  "Sky Blue": "bg-primary",
};

type SizeColorSelectorProps = {
  sizes: string[];
  colors: string[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
};

export function SizeColorSelector({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
}: SizeColorSelectorProps) {
  return (
    <div className="space-y-8">
      {sizes.length > 0 ? (
        <div>
          <h3 className="mb-4 text-[17px] font-bold text-foreground">Size</h3>
          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => {
              const isActive = size === selectedSize;

              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSizeChange(size)}
                  className={cn(
                    "flex size-[52px] items-center justify-center rounded-full text-sm transition-transform active:scale-95",
                    isActive
                      ? "bg-primary font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(151,72,34,0.3)]"
                      : "bg-card font-medium text-foreground shadow-sm",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div>
          <h3 className="mb-4 text-[17px] font-bold text-foreground">Color</h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isActive = color === selectedColor;
              const swatchClass =
                colorSwatchMap[color] ?? "bg-muted-foreground";

              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={color}
                  onClick={() => onColorChange(color)}
                  className={cn(
                    "flex size-[52px] items-center justify-center rounded-full transition-transform active:scale-95",
                    isActive
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "ring-1 ring-border",
                  )}
                >
                  <span
                    className={cn("size-7 rounded-full", swatchClass)}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
