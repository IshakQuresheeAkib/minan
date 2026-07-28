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
} from "@/components/shared/nav-pill-shared";
import { primaryNavItems } from "@/constants/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const styles = NAV_PILL_VARIANT_STYLES.default;
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

  function handlePointerEnter(
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

  function handlePointerLeave() {
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
      <div
        className={cn(
          "pointer-events-auto relative isolate w-full max-w-md rounded-full border p-[5px]",
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
          className="relative z-3 flex w-full items-center justify-between"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            if (item.disabled || !item.href) {
              return (
                <span
                  key={item.id}
                  aria-disabled="true"
                  className={cn(
                    "relative z-3 flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-semibold tracking-wide",
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
                onPointerEnter={(event) =>
                  handlePointerEnter(event, itemEnabledIndex)
                }
                onPointerLeave={handlePointerLeave}
                className={cn(
                  "relative z-3 flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-semibold tracking-wide transition-colors duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground focus-visible:outline-none",
                  isActive ? styles.linkActive : styles.linkInactive,
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
