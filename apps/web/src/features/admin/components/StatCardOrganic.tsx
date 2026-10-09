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
  progressPercent?: string | number;
  progressValue?: string;
  countdownText?: string;
  className?: string;
  icon?: ReactNode;
  onActionClick?: () => void;
};

// Map shapeVariant (1..4) to the 4 signature colors from course-design-cards
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
    progressBarColor: string;
    defaultProgress: number;
    defaultCountdown: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
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
    progressBarColor: "#0d9488",
    defaultProgress: 90,
    defaultCountdown: "Live Hub",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200/80",
    badgeText: "text-emerald-700",
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
    progressBarColor: "#0284c7",
    defaultProgress: 65,
    defaultCountdown: "Active",
    badgeBg: "bg-sky-50",
    badgeBorder: "border-sky-200/80",
    badgeText: "text-sky-700",
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
    progressBarColor: "#d97706",
    defaultProgress: 40,
    defaultCountdown: "Pending",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200/80",
    badgeText: "text-amber-700",
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
    progressBarColor: "#a63d2a",
    defaultProgress: 50,
    defaultCountdown: "Storefront",
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-200/80",
    badgeText: "text-rose-700",
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
  progressPercent,
  progressValue,
  countdownText,
  className,
  icon,
  onActionClick,
}: StatCardProps) {
  // Resolve active color variant (explicit prop or mapped from shapeVariant 1..4)
  const resolvedColor: CardColorVariant =
    colorVariant ?? SHAPE_TO_COLOR[shapeVariant] ?? "green";
  const cfg = COLOR_CONFIG[resolvedColor];

  // Resolve numerical progress percentage
  const parsedProgress =
    typeof progressPercent === "number"
      ? progressPercent
      : typeof progressPercent === "string"
        ? parseFloat(progressPercent.replace("%", ""))
        : cfg.defaultProgress;
  const safeProgress = Number.isFinite(parsedProgress)
    ? Math.max(0, Math.min(100, parsedProgress))
    : cfg.defaultProgress;

  const displayProgressText =
    progressValue ??
    (typeof progressPercent === "number"
      ? `${progressPercent}%`
      : progressPercent !== undefined
        ? progressPercent
        : `${safeProgress}%`);

  const displayCountdown = countdownText ?? cfg.defaultCountdown;

  return (
    <div
      className={cn(
        "group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[2rem]",
        "border border-[#E8E1D5]/80 bg-white/95 text-[#1A1715]",
        "shadow-[0_4px_20px_-4px_rgba(40,30,20,0.05),0_2px_6px_-1px_rgba(40,30,20,0.02)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_12px_28px_-6px_rgba(40,30,20,0.08),0_4px_10px_-2px_rgba(40,30,20,0.03)]",
        className,
      )}
      style={{
        background: cfg.radialGradient,
      }}
    >
      {/* Precision Gradient Border Overlay via CSS mask */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem] p-[1.5px] transition-opacity duration-300"
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
        className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full blur-2xl opacity-15 transition-opacity duration-300 group-hover:opacity-30"
        style={{ background: cfg.accentColor }}
        aria-hidden="true"
      />

      {/* ================= CARD HEADER & BODY ================= */}
      <div className="relative z-10 p-5 pb-3">
        {/* Top Header: Title + Themed Icon / Action */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
            {title}
          </p>
          {icon ? (
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: cfg.accentLight,
                color: cfg.accentColor,
                boxShadow: `0 2px 8px ${cfg.glowShadow}`,
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

        {/* Primary Metric Value */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
            {value}
          </span>
        </div>

        {/* Context Subtitle */}
        {subtitle ? (
          <p className="mt-1 text-xs font-medium text-neutral-500">
            {subtitle}
          </p>
        ) : null}

        {/* ================= PROGRESS BAR SECTION ================= */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-neutral-500">Progress</span>
            <span
              className="font-mono text-xs font-bold"
              style={{ color: cfg.accentColor }}
            >
              {displayProgressText}
            </span>
          </div>

          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#EFEAE2]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${safeProgress}%`,
                backgroundColor: cfg.progressBarColor,
                boxShadow: `0 0 8px ${cfg.glowShadow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= CARD FOOTER LAYER ================= */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-t border-[#EAE3D6]/80 bg-[#FAF7F2]/90 px-5 py-3 rounded-b-[2rem] text-xs">
        {/* Left Side: Growth / Trend Pill */}
        {change ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight",
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
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <div
              className="size-1.5 rounded-full"
              style={{ backgroundColor: cfg.accentColor }}
            />
            <span>Steady</span>
          </div>
        )}

        {/* Right Side: Button Countdown / Status Pill */}
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#E4DDD1] bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700 shadow-2xs transition-all duration-200 hover:border-transparent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = cfg.accentColor;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.color = "";
          }}
        >
          {displayCountdown}
        </button>
      </div>
    </div>
  );
}

// Retain alias for backward compatibility
export const StatCard = StatCardOrganic;
