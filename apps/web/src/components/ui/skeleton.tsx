import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      {...props}
      aria-hidden="true"
      className={cn("minan-skeleton", className)}/>
  );
}

export { Skeleton };
