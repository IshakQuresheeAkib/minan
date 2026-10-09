"use client";

import { Info, MapPin, Users } from "lucide-react";
import type { DemographicInsight, LocationInsight } from "@/features/admin/types";

function formatRegionName(city: string): string {
  const lower = city.toLowerCase().trim();
  if (lower.includes("outside sylhet")) return "Outside Sylhet";
  if (lower.includes("inside sylhet")) return "Inside Sylhet";
  return city;
}

function RetentionRing({
  percentage = 0,
  size = 46,
  strokeWidth = 4,
}: {
  percentage?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Retention rate ${percentage}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
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
          className="stroke-[#1C1917] transition-all duration-700 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute font-sans text-[11px] font-bold text-[#1C1917]">
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
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E1D5]/80 bg-white/95 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#1A1715] sm:text-xl">
            Customer Insights
          </h2>
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF5EE] text-[#8C7A6B]">
            <Users className="size-3.5" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* Retention Rate Box */}
        <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EBE3D7]/70 bg-[#FAF7F2]/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <span>Retention Rate</span>
                <Info className="size-3 text-neutral-400" />
              </div>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
                {retentionRate}%
              </p>
            </div>
            <RetentionRing percentage={retentionRate} size={46} strokeWidth={4} />
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t border-[#EFE8DC]/80 pt-2.5 text-xs">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate font-medium text-emerald-800">
              {repeatCustomersCount > 0 ? (
                <>
                  <span className="font-semibold">{repeatCustomersCount}</span> returning{" "}
                  {repeatCustomersCount === 1 ? "buyer" : "buyers"}
                </>
              ) : (
                "Total customer loyalty"
              )}
            </span>
          </div>
        </div>

        {/* Top Delivery Locations */}
        <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EBE3D7]/70 bg-[#FAF7F2]/60 p-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Delivery Regions
              </h3>
              <MapPin className="size-3.5 text-[#8C7A6B]" />
            </div>

            <ul className="mt-2.5 space-y-2 text-xs">
              {topLocations.length > 0 ? (
                topLocations.map((loc) => {
                  const displayName = formatRegionName(loc.city);
                  const shareValue = parseInt(loc.share.replace("%", ""), 10) || 0;
                  return (
                    <li key={loc.city} className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5 font-medium text-neutral-700">
                        <span className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="size-1.5 shrink-0 rounded-full bg-[#8C7A6B]" />
                          <span className="truncate" title={loc.city}>
                            {displayName}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-bold text-neutral-900">
                          {loc.share}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-[#EFE9E0]">
                        <div
                          className="h-full rounded-full bg-[#8C7A6B] transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(shareValue, 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-xs italic text-neutral-400">No regional data yet</li>
              )}
            </ul>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#EFE8DC]/80 pt-2.5 text-[11px] text-neutral-500">
            <span>Primary Hub</span>
            <span className="font-semibold text-neutral-700">Sylhet, BD</span>
          </div>
        </div>
      </div>

      {/* Category Demand Section */}
      <div className="mt-4 border-t border-[#F2ECE1]/80 pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Category Demand
        </h3>
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {demographics.length > 0 ? (
            demographics.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="truncate font-medium text-neutral-700"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFE9E0]">
                  <div
                    className="h-full rounded-full bg-[#1C1917] transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs italic text-neutral-400">
              No category data available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
