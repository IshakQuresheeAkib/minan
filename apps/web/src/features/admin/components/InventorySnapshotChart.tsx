"use client";

import Link from "next/link";
import { AlertCircle, Layers } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { InventorySnapshotData } from "@/features/admin/types";

export function InventorySnapshotChart({
  inventory,
  className,
}: {
  inventory?: InventorySnapshotData;
  className?: string;
}) {
  const width = 320;
  const height = 150;
  const barWidth = 14;
  const barRadius = 7;

  const categories = inventory?.categories && inventory.categories.length > 0
    ? inventory.categories.slice(0, 8)
    : [];

  const topCategories = [...categories]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const maxCount = Math.max(...categories.map((c) => c.count), 1);
  const lowStockCount = inventory?.lowStockCount ?? 0;
  const totalProducts = inventory?.totalProducts ?? 0;

  // Generate bar coordinates
  const bars = categories.map((cat, idx) => {
    const rawHeight = (cat.count / maxCount) * 100;
    const barHeightPct = Math.max(rawHeight, 15);
    const isHighlight = cat.count === maxCount && maxCount > 0;
    return {
      id: cat.id || `${idx}`,
      name: cat.name,
      count: cat.count,
      height: barHeightPct,
      highlight: isHighlight,
    };
  });

  // Trend points weaving across the bars
  const trendPoints = bars.map((bar, index) => {
    const x = 25 + index * (270 / Math.max(bars.length - 1, 1));
    const barH = (bar.height / 100) * (height - 35);
    const y = height - barH - 12;
    return { x, y: Math.max(y - 8, 20), isPeak: bar.highlight };
  });

  function generateSpline(pts: typeof trendPoints) {
    if (pts.length < 2 || !pts[0]) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)] ?? pts[0];
      const p1 = pts[i] ?? pts[0];
      const p2 = pts[i + 1] ?? pts[0];
      const p3 = pts[Math.min(i + 2, pts.length - 1)] ?? pts[0];

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  const splinePath = generateSpline(trendPoints);
  const peakPoint = trendPoints.find((p) => p.isPeak) || trendPoints[0];

  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E1D5]/80 bg-white/95 p-5 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)] sm:p-6",
        className,
      )}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-bold tracking-tight text-[#1A1715] sm:text-xl">
              Inventory Snapshot
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF5EE] text-[#8C7A6B]">
              <Layers className="size-3.5" />
            </div>
          </div>

          {lowStockCount > 0 ? (
            <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800">
              <AlertCircle className="size-3" />
              <span>{lowStockCount} low stock</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
              Catalog Healthy
            </Badge>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-500">
            {totalProducts} Total Item{totalProducts === 1 ? "" : "s"}
          </span>
          <span className="text-[11px] text-neutral-400">
            {categories.length} active categories
          </span>
        </div>
      </div>

      {/* Combo SVG Chart & Breakdown */}
      <div className="relative my-auto flex flex-1 flex-col items-center justify-center py-2 sm:py-3">
        {bars.length > 0 ? (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-36 w-full max-h-[175px] overflow-visible sm:h-40 md:h-44"
            >
              <defs>
                <linearGradient id="goldCurve" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C99757" />
                  <stop offset="50%" stopColor="#E5A642" />
                  <stop offset="100%" stopColor="#B38038" />
                </linearGradient>
              </defs>

              {/* Vertical Pill Bars */}
              {bars.map((bar, index) => {
                const x = 25 + index * (270 / Math.max(bars.length - 1, 1));
                const barH = (bar.height / 100) * (height - 35);
                const y = height - barH - 10;

                return (
                  <g key={bar.id}>
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={barRadius}
                      ry={barRadius}
                      fill={bar.highlight ? "#1C1917" : "#ECE4D6"}
                      className="transition-all duration-500 hover:opacity-80"
                    >
                      <title>{`${bar.name}: ${bar.count} items`}</title>
                    </rect>
                  </g>
                );
              })}

              {/* Overlaid Golden Spline Path */}
              {splinePath ? (
                <path
                  d={splinePath}
                  fill="none"
                  stroke="url(#goldCurve)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Anchor node on peak bar */}
              {peakPoint ? (
                <circle
                  cx={peakPoint.x}
                  cy={peakPoint.y}
                  r="4"
                  fill="#FAF8F5"
                  stroke="#1C1917"
                  strokeWidth="2"
                />
              ) : null}
            </svg>

            {/* Top Categories Distribution Chips */}
            {topCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {topCategories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E1D5]/70 bg-[#FAF7F2]/80 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:border-[#DACFBF] hover:bg-[#FAF5EE]"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[#8C7A6B]" />
                    <span className="max-w-[85px] truncate sm:max-w-[110px]" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-semibold text-neutral-900">{cat.count}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-36 w-full items-center justify-center text-xs text-neutral-400">
            No product categories found
          </div>
        )}
      </div>

      {/* Footer Restock Action */}
      <div className="mt-auto flex items-center justify-between border-t border-[#EFE8DC] pt-3 text-xs">
        <span className="font-medium text-neutral-500">
          Catalog distribution
        </span>
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="h-8 cursor-pointer rounded-full border-[#E4DDD1] bg-transparent text-xs font-semibold text-neutral-700 shadow-none hover:bg-[#FAF7F2] hover:text-neutral-900"
        >
          <Link href={adminRoutes.products}>
            Manage Catalog
          </Link>
        </Button>
      </div>
    </div>
  );
}
