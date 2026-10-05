"use client";

import { Info, MapPin, Users } from "lucide-react";
import type { DemographicInsight, LocationInsight } from "@/features/admin/types";

function RetentionRing({ percentage = 0 }: { percentage?: number }) {
  const size = 64;
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] overflow-visible"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[#E8DFD3]"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[#1C1917] transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute font-sans text-xs font-bold text-[#1C1917]">
        {percentage}%
      </span>
    </div>
  );
}

export function CustomerInsights({
  demographics = [],
  retentionRate = 0,
  repeatCustomersCount = 0,
  topLocations = [],
}: {
  demographics?: DemographicInsight[];
  retentionRate?: number;
  repeatCustomersCount?: number;
  topLocations?: LocationInsight[];
}) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[#E8E1D5]/70 bg-white/95 p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight text-[#1A1715]">
          Customer Insights
        </h2>
        <div className="flex size-7 items-center justify-center rounded-full bg-[#FAF5EE] text-[#8C7A6B]">
          <Users className="size-3.5" />
        </div>
      </div>

      {/* Demographics / Category Share Section */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Category Demand
        </h3>
        <div className="mt-2.5 space-y-2.5">
          {demographics.length > 0 ? (
            demographics.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-neutral-700" title={item.label}>
                    {item.label}
                  </span>
                  <span className="font-semibold text-neutral-900">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFE9E0]">
                  <div
                    className="h-full rounded-full bg-[#1C1917] transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 italic">No category data available yet</p>
          )}
        </div>
      </div>

      {/* Retention Rate */}
      <div className="mt-5 rounded-2xl border border-[#EBE3D7]/60 bg-[#FAF7F2]/60 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-neutral-500">
              <span>Retention Rate</span>
              <Info className="size-3 text-neutral-400" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1A1715]">
              {retentionRate}%
            </p>
            {repeatCustomersCount > 0 ? (
              <span className="text-[10px] text-emerald-700 font-medium">
                {repeatCustomersCount} returning buyer{repeatCustomersCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <RetentionRing percentage={retentionRate} />
        </div>
      </div>

      {/* Top Locations & Map Graphic */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Geographic Distribution
        </h3>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
            {topLocations.map((loc) => (
              <li key={loc.city} className="flex items-center justify-between gap-1.5 font-medium text-neutral-700">
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="size-3 text-neutral-400 shrink-0" />
                  <span className="truncate" title={loc.city}>{loc.city}</span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-neutral-900">{loc.share}</span>
              </li>
            ))}
          </ul>

          {/* Minimalist World / Region Map SVG */}
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F2] p-1 border border-[#EAE2D5]/50">
            <svg
              viewBox="0 0 100 60"
              className="size-full fill-[#DCD3C5] opacity-70"
              aria-hidden="true"
            >
              {/* Stylized region map */}
              <path d="M10,20 Q15,10 25,15 Q35,12 40,25 Q35,35 25,32 Q15,30 10,20 Z" />
              <path d="M50,15 Q65,10 75,18 Q85,25 80,40 Q65,45 55,35 Q45,28 50,15 Z" />
              <path d="M60,42 Q70,40 75,48 Q70,55 62,52 Z" />
              {/* Glowing location indicators */}
              <circle cx="28" cy="22" r="2.5" className="fill-[#F5B836] animate-pulse" />
              <circle cx="68" cy="28" r="3" className="fill-[#1C1917]" />
              <circle cx="72" cy="22" r="2" className="fill-[#10B981]" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
