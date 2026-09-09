"use client";

import Link, { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";
import {
  type ComponentProps,
  type CSSProperties,
  useEffect,
  useRef,
} from "react";

import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";
import { StarButtonVisual } from "@/components/ui/star-button";
import { cn } from "@/lib/utils";

type ProductDetailsLinkProps = ComponentProps<typeof Link> & {
  starAccent?: boolean;
};

type ProductDetailsLinkStyle = CSSProperties & {
  "--duration": number;
  "--light-width": string;
  "--light-color": string;
  "--border-width": string;
};

export function ProductDetailsLink({
  children,
  className,
  starAccent = false,
  style,
  ...props
}: ProductDetailsLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!starAccent) {
      return;
    }

    const link = linkRef.current;

    if (!link) {
      return;
    }

    const setPath = () => {
      link.style.setProperty(
        "--path",
        `path('M 0 0 H ${link.offsetWidth} V ${link.offsetHeight} H 0 V 0')`,
      );
    };

    setPath();
    const observer = new ResizeObserver(setPath);
    observer.observe(link);

    return () => observer.disconnect();
  }, [starAccent]);

  return (
    <Link
      {...props}
      ref={linkRef}
      className={cn(
        starAccent &&
          "group/star-button relative z-[3] isolate overflow-hidden",
        className,
      )}
      style={
        starAccent
          ? ({
              ...style,
              "--duration": 3,
              "--light-width": "110px",
              "--light-color": "#FAFAFA",
              "--border-width": "2px",
              isolation: "isolate",
            } as ProductDetailsLinkStyle)
          : style
      }
    >
      {starAccent ? (
        <>
          <StarButtonVisual />
          <span className="relative z-10">{children}</span>
        </>
      ) : (
        children
      )}
      <PendingProductDetailsSkeleton />
    </Link>
  );
}

function PendingProductDetailsSkeleton() {
  const { pending } = useLinkStatus();

  if (!pending || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <ProductDetailsSkeleton />
    </div>,
    document.body,
  );
}
