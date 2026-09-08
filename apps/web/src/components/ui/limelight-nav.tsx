"use client";

import Link from "next/link";
import {
  cloneElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

type NavIconProps = {
  "aria-hidden"?: boolean;
  className?: string;
};

export type LimelightNavItem = {
  id: string;
  icon: ReactElement<NavIconProps>;
  label: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
};

type LimelightNavProps = {
  activeItemId?: string;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  items: readonly LimelightNavItem[];
  labelClassName?: string;
  limelightClassName?: string;
  onTabChange?: (index: number) => void;
  orientation?: "horizontal" | "vertical";
};

/**
 * A route-capable navigation bar whose active item projects a focused
 * limelight above its icon.
 */
export function LimelightNav({
  activeItemId,
  ariaLabel = "Main navigation",
  className,
  iconClassName,
  iconContainerClassName,
  items,
  labelClassName,
  limelightClassName,
  onTabChange,
  orientation = "vertical",
}: LimelightNavProps) {
  const containerRef = useRef<HTMLElement>(null);
  const limelightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [isReady, setIsReady] = useState(false);

  const activeIndex = items.findIndex((item) => item.id === activeItemId);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const isHorizontal = orientation === "horizontal";

  useLayoutEffect(() => {
    const container = containerRef.current;
    const limelight = limelightRef.current;
    const item = activeItem ? itemRefs.current.get(activeItem.id) : undefined;

    if (!container || !limelight || !item) {
      return;
    }

    const positionLimelight = () => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const left = itemCenter - limelight.offsetWidth / 2;

      limelight.style.left = `${left}px`;
      limelight.style.opacity = "1";
      setIsReady(true);
    };

    positionLimelight();

    const resizeObserver = new ResizeObserver(positionLimelight);
    resizeObserver.observe(container);
    resizeObserver.observe(item);
    window.addEventListener("resize", positionLimelight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", positionLimelight);
    };
  }, [activeItem]);

  useEffect(() => {
    if (!activeItem) {
      const limelight = limelightRef.current;

      if (limelight) {
        limelight.style.opacity = "0";
      }
    }
  }, [activeItem]);

  if (items.length === 0) {
    return null;
  }

  function setItemRef(id: string) {
    return (element: HTMLAnchorElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
        return;
      }

      itemRefs.current.delete(id);
    };
  }

  return (
    <nav
      ref={containerRef}
      aria-label={ariaLabel}
      data-limelight-active-id={activeItem?.id}
      className={cn(
        "relative isolate flex items-center border border-primary/30 bg-foreground/96 px-1.5 text-background shadow-xl shadow-foreground/25 backdrop-blur",
        isHorizontal
          ? "h-14 w-fit rounded-[1.125rem]"
          : "h-16 w-full rounded-[1.25rem]",
        className,
      )}
    >
      <span
        ref={limelightRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 z-0 h-1 w-11 rounded-b-full bg-primary opacity-0 shadow-lg shadow-primary/55",
          isReady && "transition-[left,opacity] duration-300 ease-out",
          limelightClassName,
        )}
        style={{ left: "-999px" }}
      >
        <span className="pointer-events-none absolute top-1 left-1/2 h-12 w-20 lg:w-28 -translate-x-1/2 bg-gradient-to-b from-primary/35 to-transparent [clip-path:polygon(15%_0,85%_0,100%_100%,0_100%)]" />
      </span>

      {items.map((item, index) => {
        const isActive = item.id === activeItem?.id;
        const icon = cloneElement(item.icon, {
          "aria-hidden": true,
          className: cn(
            "size-5 shrink-0 transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-55",
            item.icon.props.className,
            iconClassName,
          ),
        });
        const content = (
          <>
            {icon}
            <span
              className={cn(
                "font-semibold tracking-wide",
                isHorizontal
                  ? "text-sm whitespace-nowrap"
                  : "max-w-full truncate text-[10px]",
                labelClassName,
              )}
            >
              {item.label}
            </span>
          </>
        );
        const itemClassName = cn(
          "relative z-10 flex items-center justify-center rounded-xl transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground focus-visible:outline-none",
          isHorizontal
            ? "flex-row gap-1.5 px-5 py-2"
            : "min-w-0 flex-1 flex-col gap-1 px-2 py-2",
          isActive ? "text-background" : "text-background/70 hover:text-background",
          iconContainerClassName,
        );

        if (item.disabled || !item.href) {
          return (
            <span
              key={item.id}
              aria-disabled="true"
              className={cn(itemClassName, "cursor-not-allowed opacity-45")}
            >
              {content}
            </span>
          );
        }

        return (
          <Link
            key={item.id}
            ref={setItemRef(item.id)}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => {
              onTabChange?.(index);
              item.onClick?.();
            }}
            className={itemClassName}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
