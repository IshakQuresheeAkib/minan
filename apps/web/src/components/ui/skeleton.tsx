import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      {...props}
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-linear-to-br from-secondary/35 via-secondary/20 to-primary/20 ring-1 ring-inset ring-primary/10 after:absolute after:inset-0 after:bg-linear-to-r after:from-transparent after:via-background/75 after:to-transparent after:will-change-transform motion-safe:after:animate-[minan-skeleton-shimmer_1.8s_ease-in-out_infinite] motion-reduce:after:hidden",
        className,
      )}
    />
  );
}

export { Skeleton };
