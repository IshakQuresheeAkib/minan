"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  shapeVariant?: 1 | 2 | 3 | 4;
  className?: string;
  icon?: ReactNode;
};

// SVG Path definitions for the 4 organic fluid card shapes
const SVG_SHAPES: Record<1 | 2 | 3 | 4, string> = {
  // Shape 1: Total Sales (Organic concave sweep on right side)
  1: "M 26 3 C 12 3 3 12 3 26 L 3 124 C 3 138 12 147 26 147 L 156 147 C 174 147 184 135 180 110 C 176 84 192 68 197 40 C 200 18 186 3 162 3 Z",

  // Shape 2: New Customers (Organic flowing wave on left side)
  2: "M 36 3 C 16 3 8 18 12 42 C 16 70 3 88 7 114 C 11 138 22 147 40 147 L 174 147 C 188 147 197 138 197 124 L 197 26 C 197 12 188 3 174 3 Z",

  // Shape 3: Open Orders (Organic contoured top-right sweep)
  3: "M 26 3 C 12 3 3 12 3 26 L 3 124 C 3 138 12 147 26 147 L 166 147 C 184 147 197 136 197 118 C 197 90 180 76 185 48 C 189 22 180 3 156 3 Z",

  // Shape 4: Conversion Rate (Organic sculpted wave contour)
  4: "M 38 3 C 18 3 9 18 13 46 C 17 76 3 92 7 116 C 11 138 24 147 42 147 L 172 147 C 188 147 197 136 197 120 L 197 30 C 197 14 186 3 170 3 Z",
};

export function StatCardOrganic({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  shapeVariant = 1,
  className,
  icon,
}: StatCardProps) {
  const pathD = SVG_SHAPES[shapeVariant] ?? SVG_SHAPES[1];

  return (
    <div
      className={cn(
        "group relative flex min-h-[148px] flex-col justify-between p-5 transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      {/* SVG Background with organic curved path and border */}
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible drop-shadow-[0_4px_16px_rgba(40,30,20,0.05)] transition-all duration-300 group-hover:drop-shadow-[0_8px_24px_rgba(40,30,20,0.08)]"
        viewBox="0 0 200 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={pathD}
          className="fill-white/95 stroke-[#E8E1D5]/80 transition-colors duration-300 group-hover:fill-white group-hover:stroke-[#D9CEBF]"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Card Content Layer */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
            {title}
          </p>
          {icon ? (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] text-[#8C7A6B]">
              {icon}
            </div>
          ) : (
            <div className="size-2 rounded-full bg-[#E5A642]/60 transition-transform duration-300 group-hover:scale-125" />
          )}
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
            {value}
          </span>
        </div>
      </div>

      {/* Card Footer Layer */}
      <div className="relative z-10 mt-3 flex items-center justify-between gap-2 border-t border-[#F2ECE1]/60 pt-2.5 text-xs">
        {change ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[11px]",
              isPositive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100/80"
                : "bg-rose-50 text-rose-700 border border-rose-100/80",
            )}
          >
            {isPositive ? (
              <TrendingUp className="size-3 stroke-[2.5]" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3 stroke-[2.5]" aria-hidden="true" />
            )}
            <span>{change}</span>
          </div>
        ) : subtitle ? (
          <span className="text-[11px] font-medium text-neutral-400">{subtitle}</span>
        ) : null}

        {subtitle && change ? (
          <span className="text-[11px] text-neutral-400">{subtitle}</span>
        ) : (
          <div className="size-1.5 rounded-full bg-[#E5A642]/50 transition-transform duration-300 group-hover:scale-125" />
        )}
      </div>
    </div>
  );
}

// Retain alias for backward compatibility
export const StatCard = StatCardOrganic;
