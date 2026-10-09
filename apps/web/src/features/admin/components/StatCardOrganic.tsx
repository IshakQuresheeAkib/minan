"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardColorVariant = "green" | "blue" | "orange" | "red";

export type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  shapeVariant?: 1 | 2 | 3 | 4;
  colorVariant?: CardColorVariant;
  className?: string;
  icon?: ReactNode;
  onActionClick?: () => void;
};

const SHAPE_TO_COLOR: Record<1 | 2 | 3 | 4, CardColorVariant> = {
  1: "green",
  2: "blue",
  3: "orange",
  4: "red",
};

// Rich color schemes tailored for MINAN light theme
const COLOR_CONFIG: Record<
  CardColorVariant,
  {
    colorClass: string;
    accentColor: string;
    accentLight: string;
    radialGradient: string;
    borderGradient: string;
    glowShadow: string;
  }
> = {
  green: {
    colorClass: "green",
    accentColor: "#0d9488",
    accentLight: "rgba(16, 118, 103, 0.08)",
    radialGradient:
      "radial-gradient(ellipse at right top, rgba(16, 118, 103, 0.12) 0%, rgba(255, 255, 255, 0.96) 55%, #FFFFFF 100%)",
    borderGradient:
      "linear-gradient(135deg, rgba(232, 225, 213, 0.9) 0%, rgba(232, 225, 213, 0.4) 60%, rgba(16, 118, 103, 0.35) 100%)",
    glowShadow: "rgba(16, 118, 103, 0.16)",
  },
  blue: {
    colorClass: "blue",
    accentColor: "#0284c7",
    accentLight: "rgba(0, 69, 143, 0.08)",
    radialGradient:
      "radial-gradient(ellipse at right top, rgba(0, 69, 143, 0.10) 0%, rgba(255, 255, 255, 0.96) 55%, #FFFFFF 100%)",
    borderGradient:
      "linear-gradient(135deg, rgba(232, 225, 213, 0.9) 0%, rgba(232, 225, 213, 0.4) 60%, rgba(0, 69, 143, 0.35) 100%)",
    glowShadow: "rgba(0, 69, 143, 0.16)",
  },
  orange: {
    colorClass: "orange",
    accentColor: "#d97706",
    accentLight: "rgba(255, 183, 65, 0.12)",
    radialGradient:
      "radial-gradient(ellipse at right top, rgba(255, 183, 65, 0.14) 0%, rgba(255, 255, 255, 0.96) 55%, #FFFFFF 100%)",
    borderGradient:
      "linear-gradient(135deg, rgba(232, 225, 213, 0.9) 0%, rgba(232, 225, 213, 0.4) 60%, rgba(255, 183, 65, 0.45) 100%)",
    glowShadow: "rgba(217, 119, 6, 0.16)",
  },
  red: {
    colorClass: "red",
    accentColor: "#a63d2a",
    accentLight: "rgba(166, 61, 42, 0.08)",
    radialGradient:
      "radial-gradient(ellipse at right top, rgba(166, 61, 42, 0.10) 0%, rgba(255, 255, 255, 0.96) 55%, #FFFFFF 100%)",
    borderGradient:
      "linear-gradient(135deg, rgba(232, 225, 213, 0.9) 0%, rgba(232, 225, 213, 0.4) 60%, rgba(166, 61, 42, 0.35) 100%)",
    glowShadow: "rgba(166, 61, 42, 0.16)",
  },
};

export function StatCardOrganic({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  shapeVariant = 1,
  colorVariant,
  className,
  icon,
  onActionClick,
}: StatCardProps) {
  // Resolve active color variant (explicit prop or mapped from shapeVariant 1..4)
  const resolvedColor: CardColorVariant =
    colorVariant ?? SHAPE_TO_COLOR[shapeVariant] ?? "green";
  const cfg = COLOR_CONFIG[resolvedColor];

  return (
    <div
      onClick={onActionClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5",
        "border border-[#E8E1D5]/80 bg-white/95 text-[#1A1715]",
        "shadow-[0_4px_16px_-4px_rgba(40,30,20,0.04),0_2px_4px_-1px_rgba(40,30,20,0.02)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(40,30,20,0.08),0_3px_8px_-2px_rgba(40,30,20,0.03)]",
        onActionClick && "cursor-pointer",
        className,
      )}
      style={{
        background: cfg.radialGradient,
      }}
      role={onActionClick ? "button" : undefined}
      tabIndex={onActionClick ? 0 : undefined}
      onKeyDown={
        onActionClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActionClick();
              }
            }
          : undefined
      }
    >
      {/* Precision Gradient Border Overlay via CSS mask */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl p-[1.5px] transition-opacity duration-300"
        style={{
          background: cfg.borderGradient,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        aria-hidden="true"
      />

      {/* Top-Right Soft Ambient Light Aura */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full blur-xl opacity-15 transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: cfg.accentColor }}
        aria-hidden="true"
      />

      {/* Header: Title + Themed Icon / Indicator */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
          {title}
        </p>
        {icon ? (
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: cfg.accentLight,
              color: cfg.accentColor,
            }}
          >
            {icon}
          </div>
        ) : (
          <div
            className="size-2 rounded-full transition-transform duration-300 group-hover:scale-125"
            style={{
              backgroundColor: cfg.accentColor,
              boxShadow: `0 0 6px ${cfg.glowShadow}`,
            }}
          />
        )}
      </div>

      {/* Metric Value */}
      <div className="relative z-10 mt-2.5 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
          {value}
        </span>
      </div>

      {/* Context: Trend & Subtitle */}
      {change || subtitle ? (
        <div className="relative z-10 mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {change ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight",
                isPositive
                  ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200/80 bg-rose-50 text-rose-700",
              )}
            >
              {isPositive ? (
                <TrendingUp className="size-3 stroke-[2.5]" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3 stroke-[2.5]" aria-hidden="true" />
              )}
              <span>{change}</span>
            </div>
          ) : null}

          {subtitle ? (
            <span className="text-[11px] font-medium text-neutral-500">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Retain alias for backward compatibility
export const StatCard = StatCardOrganic;
