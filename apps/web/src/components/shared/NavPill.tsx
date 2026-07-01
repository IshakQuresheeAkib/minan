"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import { primaryNavItems } from "@/constants/nav-items";
import { cn } from "@/lib/utils";

const NAV_ENABLED_INDEX_BY_ID = new Map(
  primaryNavItems
    .filter((item) => !item.disabled && item.href)
    .map((item, index) => [item.id, index] as const),
);

const NAV_TRANSITION_EASING =
  "linear(0, 1 44.7%, 0.898 51.8%, 0.874 55.1%, 0.866 58.4%, 0.888 64.3%, 1 77.4%, 0.98 84.5%, 1)";

const INDICATOR_TRANSITION_STYLE: CSSProperties = {
  transitionProperty: "left, width, opacity",
  transitionDuration: "700ms, 700ms, 150ms",
  transitionTimingFunction: `${NAV_TRANSITION_EASING}, ${NAV_TRANSITION_EASING}, ease`,
};

type IndicatorStyle = {
  left: number;
  width: number;
  opacity: number;
};

const HIDDEN_INDICATOR: IndicatorStyle = {
  left: 0,
  width: 0,
  opacity: 0,
};

function getOffset(el: HTMLElement): { left: number; width: number } {
  const parentRect = el.parentElement?.getBoundingClientRect();
  const rect = el.getBoundingClientRect();

  return {
    left: rect.left - (parentRect?.left ?? 0),
    width: rect.width,
  };
}

function indicatorPositionStyle(style: IndicatorStyle): CSSProperties {
  return {
    ...INDICATOR_TRANSITION_STYLE,
    left: style.left,
    width: style.width,
    opacity: style.opacity,
  };
}

function applyIndicatorPosition(
  element: HTMLSpanElement | null,
  style: IndicatorStyle,
) {
  if (!element) {
    return;
  }

  element.style.left = `${style.left}px`;
  element.style.width = `${style.width}px`;
  element.style.opacity = String(style.opacity);
}

type NavPillVariant = "overlay" | "default";

type NavPillProps = {
  variant?: NavPillVariant;
};

const NAV_PILL_VARIANT_STYLES = {
  overlay: {
    shell:
      "bg-white/5 border-primary/10 shadow-2xl shadow-primary/40 backdrop-blur-md",
    hoverIndicator: "bg-primary/40",
    activeIndicator: "bg-primary text-black",
    disabledLink: "text-background/35",
    linkActive: "text-foreground",
    linkInactive: "text-background/90 hover:text-background",
  },
  default: {
    shell:
      "bg-background/95 border-border/50 shadow-md shadow-primary/20 backdrop-blur-md",
    hoverIndicator: "bg-primary/35",
    activeIndicator: "bg-primary",
    disabledLink: "text-muted-foreground/45",
    linkActive: "text-foreground",
    linkInactive: "text-foreground/80 hover:text-foreground",
  },
} as const satisfies Record<
  NavPillVariant,
  {
    shell: string;
    hoverIndicator: string;
    activeIndicator: string;
    disabledLink: string;
    linkActive: string;
    linkInactive: string;
  }
>;

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
