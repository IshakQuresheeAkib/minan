"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import {
  HIDDEN_INDICATOR,
  NAV_ENABLED_INDEX_BY_ID,
  NAV_PILL_VARIANT_STYLES,
  applyIndicatorPosition,
  getOffset,
  indicatorPositionStyle,
  type IndicatorStyle,
  type NavPillVariant,
} from "@/components/shared/nav-pill-shared";
import { primaryNavItems } from "@/constants/nav-items";
import { cn } from "@/lib/utils";

type NavPillProps = {
  variant?: NavPillVariant;
};

export function NavPill({ variant = "default" }: NavPillProps) {
  const styles = NAV_PILL_VARIANT_STYLES[variant];
  const pathname = usePathname();
  const linkRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeIndicatorRef = useRef<HTMLSpanElement>(null);
  const [hoverIndicator, setHoverIndicator] =
    useState<IndicatorStyle>(HIDDEN_INDICATOR);

  const enabledItems = primaryNavItems.filter(
    (item) => !item.disabled && item.href,
  );

  const activeIndex = enabledItems.findIndex((item) => item.href === pathname);

  const updateActiveIndicator = useCallback(() => {
    if (activeIndex < 0) {
      applyIndicatorPosition(activeIndicatorRef.current, HIDDEN_INDICATOR);
      return;
    }

    const activeItem = enabledItems[activeIndex];

    if (!activeItem) {
      applyIndicatorPosition(activeIndicatorRef.current, HIDDEN_INDICATOR);
      return;
    }

    const el = linkRefs.current.get(activeItem.id);

    if (!el) {
      return;
    }

    const { left, width } = getOffset(el);
    applyIndicatorPosition(activeIndicatorRef.current, {
      left: left + 5,
      width,
      opacity: 1,
    });
  }, [activeIndex, enabledItems]);

  useLayoutEffect(() => {
    updateActiveIndicator();
  }, [updateActiveIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateActiveIndicator);
    return () => window.removeEventListener("resize", updateActiveIndicator);
  }, [updateActiveIndicator]);

  function handleMouseEnter(
    event: MouseEvent<HTMLAnchorElement>,
    index: number,
  ) {
    if (index === activeIndex) {
      setHoverIndicator(HIDDEN_INDICATOR);
      return;
    }

    const { left, width } = getOffset(event.currentTarget);
    setHoverIndicator({ left: left + 5, width, opacity: 1 });
  }

  function handleMouseLeave() {
    setHoverIndicator((prev) => ({ ...prev, opacity: 0 }));
  }

  function setLinkRef(id: string) {
    return (element: HTMLAnchorElement | null) => {
      if (element) {
        linkRefs.current.set(id, element);
        return;
      }

      linkRefs.current.delete(id);
    };
  }

  return (
    <div
      className={cn(
        "relative hidden w-fit rounded-full border p-[5px] isolate lg:block",
        styles.shell,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-[5px] bottom-[5px] z-1 rounded-full",
          styles.hoverIndicator,
        )}
        style={indicatorPositionStyle(hoverIndicator)}
      />
      <span
        ref={activeIndicatorRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-[5px] bottom-[5px] z-2 rounded-full",
          styles.activeIndicator,
        )}
        style={indicatorPositionStyle(HIDDEN_INDICATOR)}
      />

      <nav
        aria-label="Main navigation"
        className="relative z-3 flex items-center"
      >
        {primaryNavItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled || !item.href) {
            return (
              <span
                key={item.id}
                aria-disabled="true"
                className={cn(
                  "relative z-3 flex cursor-not-allowed items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap",
                  styles.disabledLink,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </span>
            );
          }

          const itemEnabledIndex = NAV_ENABLED_INDEX_BY_ID.get(item.id) ?? 0;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              ref={setLinkRef(item.id)}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={(event) =>
                handleMouseEnter(event, itemEnabledIndex)
              }
              onMouseLeave={handleMouseLeave}
              className={cn(
                "relative z-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors duration-150 ease-in-out",
                isActive ? styles.linkActive : styles.linkInactive,
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
