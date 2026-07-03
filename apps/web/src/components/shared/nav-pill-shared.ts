import type { CSSProperties } from "react";

import { primaryNavItems } from "@/constants/nav-items";

export const NAV_ENABLED_INDEX_BY_ID = new Map(
  primaryNavItems
    .filter((item) => !item.disabled && item.href)
    .map((item, index) => [item.id, index] as const),
);

export const NAV_TRANSITION_EASING =
  "linear(0, 1 44.7%, 0.898 51.8%, 0.874 55.1%, 0.866 58.4%, 0.888 64.3%, 1 77.4%, 0.98 84.5%, 1)";

export const INDICATOR_TRANSITION_STYLE: CSSProperties = {
  transitionProperty: "left, width, opacity",
  transitionDuration: "700ms, 700ms, 150ms",
  transitionTimingFunction: `${NAV_TRANSITION_EASING}, ${NAV_TRANSITION_EASING}, ease`,
};

export type IndicatorStyle = {
  left: number;
  width: number;
  opacity: number;
};

export const HIDDEN_INDICATOR: IndicatorStyle = {
  left: 0,
  width: 0,
  opacity: 0,
};

export function getOffset(el: HTMLElement): { left: number; width: number } {
  const parentRect = el.parentElement?.getBoundingClientRect();
  const rect = el.getBoundingClientRect();

  return {
    left: rect.left - (parentRect?.left ?? 0),
    width: rect.width,
  };
}

export function indicatorPositionStyle(style: IndicatorStyle): CSSProperties {
  return {
    ...INDICATOR_TRANSITION_STYLE,
    left: style.left,
    width: style.width,
    opacity: style.opacity,
  };
}

export function applyIndicatorPosition(
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

export type NavPillVariant = "overlay" | "default";

export const NAV_PILL_VARIANT_STYLES = {
  overlay: {
    shell:
      "bg-background/5 border-primary/10 shadow-md shadow-primary/20 backdrop-blur-md",
    hoverIndicator: "bg-primary/40",
    activeIndicator: "bg-primary text-foreground",
    disabledLink: "text-background/35",
    linkActive: "text-foreground",
    linkInactive: "text-background/90 hover:text-background",
  },
  default: {
    shell:
      "bg-foreground border-primary/20 shadow-md shadow-primary/20",
    hoverIndicator: "bg-primary/25",
    activeIndicator: "bg-primary",
    disabledLink: "text-background/35",
    linkActive: "text-foreground",
    linkInactive: "text-background/85 hover:text-background",
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
