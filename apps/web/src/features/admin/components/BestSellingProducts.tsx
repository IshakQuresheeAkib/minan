"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import type { BestSellingItem } from "@/features/admin/types";

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const range = max - min || 1;
  const width = 46;
  const height = 18;
  const lastVal = data[data.length - 1] ?? min;

  const points = data
    .map((val, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible stroke-emerald-500"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#059669" stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#sparkGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Arrow indicator at the end */}
      <circle
        cx={width}
        cy={height - ((lastVal - min) / range) * (height - 4) - 2}
        r="2"
        className="fill-emerald-600"
      />
    </svg>
  );
}

export function BestSellingProducts({
  items = [],
}: {
  items?: BestSellingItem[];
}) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[#E8E1D5]/70 bg-white/95 p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight text-[#1A1715]">
            Best-Selling Products
          </h2>
          <span className="inline-flex items-center rounded-full bg-[#FAF5EE] px-2 py-0.5 text-[10px] font-semibold text-[#8C7A6B]">
            Real-time
          </span>
        </div>
        <Link
          href={adminRoutes.products}
          className="group inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <span>All Products</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Product items scroll / grid */}
      {items.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((product) => (
            <Link
              key={product.id}
              href={`${adminRoutes.products}?search=${encodeURIComponent(product.name)}`}
              className="group/item flex flex-col overflow-hidden rounded-2xl bg-[#FAF7F2]/60 p-2.5 transition-all duration-300 hover:bg-[#FAF7F2] hover:shadow-sm"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#EBE5DB]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover/item:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover/item:opacity-100" />
              </div>

              {/* Product Meta */}
              <div className="mt-2.5 flex flex-col">
                <h3 className="truncate text-xs font-semibold text-[#1A1715]" title={product.name}>
                  {product.name}
                </h3>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <p className="font-display text-sm font-bold text-neutral-800">
                    ৳{(product.discountedPrice || product.price).toLocaleString("en-BD")}
                  </p>
                  {product.discountedPrice && product.discountedPrice < product.price ? (
                    <span className="text-[10px] text-neutral-400 line-through">
                      ৳{product.price.toLocaleString("en-BD")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500">
                    {product.salesCount > 0 ? `${product.salesCount} sold` : "In Catalog"}
                  </span>
                  <MiniSparkline data={product.sparkline} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E1D5] bg-[#FAF8F5] p-6 text-center">
          <Sparkles className="size-6 text-neutral-400" />
          <p className="mt-2 text-xs font-semibold text-neutral-700">No sales recorded yet</p>
          <p className="mt-1 text-[11px] text-neutral-400">Top-selling items will automatically appear here once orders are confirmed.</p>
        </div>
      )}
    </div>
  );
}
