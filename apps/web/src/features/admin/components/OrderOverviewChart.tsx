"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { DailyChartPoint, OrderOverviewData } from "@/features/admin/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrderOverviewChart({
  overview,
}: {
  overview?: OrderOverviewData;
}) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rawData: DailyChartPoint[] = useMemo(() => {
    if (timeRange === "30d") {
      return overview?.last30Days && overview.last30Days.length > 0
        ? overview.last30Days
        : [];
    }
    return overview?.last7Days && overview.last7Days.length > 0
      ? overview.last7Days
      : [];
  }, [overview, timeRange]);

  // If no data is available yet, provide 7 empty daily slots
  const data: DailyChartPoint[] = useMemo(() => {
    if (rawData.length > 0) return rawData;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => ({
      day,
      date: `Day ${i + 1}`,
      isoDate: `2026-10-0${i + 1}`,
      sales: 0,
      orders: 0,
    }));
  }, [rawData]);

  const totalPeriodSales = useMemo(
    () => data.reduce((sum, item) => sum + item.sales, 0),
    [data],
  );
  const totalPeriodOrders = useMemo(
    () => data.reduce((sum, item) => sum + item.orders, 0),
    [data],
  );

  const rawMax = Math.max(...data.map((d) => d.sales), 0);
  const maxSales = Math.max(Math.ceil((rawMax || 5000) / 1000) * 1000, 1000);
  const yTicks = [
    maxSales,
    Math.round(maxSales * 0.75),
    Math.round(maxSales * 0.5),
    Math.round(maxSales * 0.25),
    0,
  ];

  // SVG Chart Dimensions
  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.sales / maxSales) * chartHeight;
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier SVG path
  function generateSmoothPath(pts: typeof points): string {
    if (pts.length < 2 || !pts[0]) return "";
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)] ?? pts[0];
      const p1 = pts[i] ?? pts[0];
      const p2 = pts[i + 1] ?? pts[0];
      const p3 = pts[Math.min(i + 2, pts.length - 1)] ?? pts[0];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }

  const linePath = generateSmoothPath(points);
  const firstPt = points[0] ?? { x: paddingLeft, y: paddingTop + chartHeight };
  const lastPt = points[points.length - 1] ?? {
    x: width - paddingRight,
    y: paddingTop + chartHeight,
  };
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${paddingTop + chartHeight} L ${firstPt.x.toFixed(1)} ${paddingTop + chartHeight} Z`;

  const activeIndex = hoveredIndex !== null && points[hoveredIndex] ? hoveredIndex : points.length - 1;
  const activePoint = points[activeIndex] ?? points[0];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E1D5]/80 bg-white/95 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1A1715]">
              Order Overview
            </h2>
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-3.5 stroke-[2.2]" />
            </div>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 font-medium">
            ৳{totalPeriodSales.toLocaleString("en-BD")} total • {totalPeriodOrders} order{totalPeriodOrders === 1 ? "" : "s"}
          </p>
        </div>

        {/* Filter Select Dropdown using reusable component */}
        <div className="relative">
          <Select
            value={timeRange}
            onValueChange={(val) => setTimeRange(val as "7d" | "30d")}
          >
            <SelectTrigger
              size="sm"
              className="w-[125px] rounded-full border-[#E4DDD1] bg-[#FAF8F5] text-xs font-semibold text-neutral-700 hover:bg-[#F3EDE3]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SVG Spline Chart */}
      <div className="relative mt-4 w-full">
        {/* Floating Tooltip */}
        {activePoint ? (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100 - 6}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="rounded-xl bg-[#1C1917] px-3 py-1.5 text-center shadow-xl border border-neutral-700">
                <span className="block text-[10px] font-medium text-neutral-300">
                  {activePoint.date}
                </span>
                <span className="block font-sans text-xs font-bold text-white">
                  ৳{activePoint.sales.toLocaleString("en-BD")}
                </span>
                <span className="block text-[10px] font-medium text-emerald-400">
                  {activePoint.orders} order{activePoint.orders === 1 ? "" : "s"}
                </span>
              </div>
              {/* Tooltip caret */}
              <div className="size-2 -translate-y-1 rotate-45 bg-[#1C1917]" />
            </div>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orderAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9C9B4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#ECE3D6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
            <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1C1917" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((val) => {
            const y = paddingTop + chartHeight - (val / maxSales) * chartHeight;
            const labelFormatted = val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `${val}`;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#EFEBE4"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-neutral-400 font-sans text-[10px]"
                >
                  ৳{labelFormatted}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#orderAreaGradient)" />

          {/* Smooth spline stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#1C1917"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineShadow)"
          />

          {/* Interactive vertical hover lines and points */}
          {points.map((pt, i) => (
            <g
              key={pt.isoDate || i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            >
              <rect
                x={pt.x - chartWidth / (points.length * 2)}
                y={paddingTop}
                width={chartWidth / points.length}
                height={chartHeight}
                fill="transparent"
              />
              {/* Highlight dot */}
              {i === activeIndex ? (
                <g>
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + chartHeight}
                    stroke="#1C1917"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.3"
                  />
                  <circle cx={pt.x} cy={pt.y} r="6" fill="#FAF8F5" stroke="#1C1917" strokeWidth="2.5" />
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#1C1917" />
                </g>
              ) : null}
            </g>
          ))}

          {/* X Axis Day / Date Labels */}
          {points
            .filter((_, idx) => (timeRange === "30d" ? idx % 5 === 0 || idx === points.length - 1 : true))
            .map((pt) => (
              <text
                key={pt.isoDate}
                x={pt.x}
                y={height - 2}
                textAnchor="middle"
                className="fill-neutral-500 font-sans text-[10px] font-medium"
              >
                {timeRange === "30d" ? pt.date : pt.day}
              </text>
            ))}
        </svg>
      </div>
    </div>
  );
}
