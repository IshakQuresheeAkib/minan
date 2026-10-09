"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShoppingBag, Sparkles } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import type { BestSellingItem } from "@/features/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";

function ProductThumbnail({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-[#EBE5DB] text-[#8C7A6B]">
        <ShoppingBag className="size-6 stroke-[1.5] opacity-50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, 20vw"
      className="object-cover transition-transform duration-500 group-hover/item:scale-105"
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}

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
      {/* Indicator at the end */}
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
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E1D5]/80 bg-white/95 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1A1715]">
            Best-Selling Products
          </h2>
          <Badge
            variant="secondary"
            className="border-none bg-[#FAF5EE] text-[10px] font-semibold text-[#8C7A6B]"
          >
            Real-time
          </Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="h-8 rounded-full border-[#E4DDD1] bg-transparent text-xs font-semibold text-neutral-600 shadow-none hover:bg-[#FAF7F2] hover:text-neutral-900"
        >
          <Link href={adminRoutes.products}>
            <span>All Products</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Product items grid */}
      {items.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
          {items.map((product) => {
            const hasDiscount =
              Boolean(product.discountedPrice) &&
              product.discountedPrice < product.price;

            return (
              <Link
                key={product.id}
                href={`${adminRoutes.products}?search=${encodeURIComponent(product.name)}`}
                className="group/item flex flex-col overflow-hidden rounded-xl border border-[#EFE8DC]/80 bg-[#FAF8F5]/60 p-2.5 transition-all duration-300 hover:border-[#E0D7C9] hover:bg-[#FAF8F5] hover:shadow-xs"
              >
                {/* Image Container with graceful fallback */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#EBE5DB]">
                  <ProductThumbnail src={product.image} alt={product.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover/item:opacity-100" />
                </div>

                {/* Product Meta */}
                <div className="mt-2.5 flex flex-col">
                  <h3
                    className="truncate text-xs font-semibold text-[#1A1715]"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <p className="font-display text-sm font-bold text-neutral-800">
                      ৳{(product.discountedPrice || product.price).toLocaleString("en-BD")}
                    </p>
                    {hasDiscount ? (
                      <span className="text-[10px] text-neutral-400 line-through">
                        ৳{product.price.toLocaleString("en-BD")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between border-t border-[#F2ECE1]/60 pt-1.5">
                    <span className="text-[11px] font-medium text-neutral-500">
                      {product.salesCount > 0 ? `${product.salesCount} sold` : "In Catalog"}
                    </span>
                    <MiniSparkline data={product.sparkline} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E1D5] bg-[#FAF8F5] p-6 text-center">
          <Sparkles className="size-6 text-neutral-400" />
          <p className="mt-2 text-xs font-semibold text-neutral-700">No sales recorded yet</p>
          <p className="mt-1 text-[11px] text-neutral-400">
            Top-selling items will automatically appear here once orders are confirmed.
          </p>
        </div>
      )}
    </div>
  );
}
