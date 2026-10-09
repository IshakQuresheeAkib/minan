"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, ShoppingBag } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import type { RecentOrderSummary } from "@/features/admin/types";

function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "delivered":
      return (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700">
          Delivered
        </Badge>
      );
    case "shipped":
      return (
        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[11px] font-semibold text-sky-700">
          Shipped
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-700">
          Processing
        </Badge>
      );
    case "confirmed":
      return (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700">
          Confirmed
        </Badge>
      );
    case "new":
      return (
        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-[11px] font-semibold text-purple-700">
          New
        </Badge>
      );
    case "returned":
      return (
        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700">
          Returned
        </Badge>
      );
    case "exchanged":
      return (
        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-700">
          Exchanged
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary" className="text-[11px] font-medium text-neutral-600">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-[#E8E1D5] bg-[#FAF7F2] text-[11px] font-medium text-neutral-700 capitalize">
          {status.replace(/_/g, " ")}
        </Badge>
      );
  }
}

function OrderThumb({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex size-full items-center justify-center bg-[#EAE2D5] text-neutral-500">
        <Package className="size-4 stroke-[1.5]" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="32px"
      className="object-cover"
      unoptimized
      onError={() => setError(true)}
    />
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "C";

  return (
    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-white bg-[#EAE2D5] font-display text-[11px] font-bold text-[#4A3E31] shadow-xs">
      {initials}
    </div>
  );
}

export function RecentOrdersList({
  orders = [],
}: {
  orders?: RecentOrderSummary[];
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E1D5]/80 bg-white/95 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1A1715]">
            Recent Orders
          </h2>
          <Badge
            variant="secondary"
            className="border-none bg-[#FAF5EE] text-[10px] font-semibold text-[#8C7A6B]"
          >
            Latest {orders.length}
          </Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="h-8 rounded-full border-[#E4DDD1] bg-transparent text-xs font-semibold text-neutral-600 shadow-none hover:bg-[#FAF7F2] hover:text-neutral-900"
        >
          <Link href={adminRoutes.orders}>
            <span>View all orders</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Table / List Header */}
      <div className="mt-4 grid grid-cols-12 border-b border-[#EFE8DC] pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        <div className="col-span-5">Customer</div>
        <div className="col-span-4">Product</div>
        <div className="col-span-3 text-right">Status</div>
      </div>

      {/* Rows */}
      {orders.length > 0 ? (
        <div className="divide-y divide-[#F5EFEB]/80">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`${adminRoutes.orders}/${order.id}`}
              className="group grid grid-cols-12 items-center py-2.5 text-xs transition-colors hover:bg-[#FAF7F2]/60 rounded-xl px-1"
            >
              {/* Customer Avatar + Name */}
              <div className="col-span-5 flex items-center gap-2.5 overflow-hidden pr-2">
                <CustomerAvatar name={order.customerName} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#1A1715]" title={order.customerName}>
                    {order.customerName}
                  </p>
                  <p className="truncate text-[10px] text-neutral-400">
                    {order.orderNumber}
                  </p>
                </div>
              </div>

              {/* Product Thumbnail + Price */}
              <div className="col-span-4 flex items-center gap-2 overflow-hidden pr-1">
                <div className="relative size-7 shrink-0 overflow-hidden rounded-md bg-[#EAE2D5] border border-[#E0D7C9]/80">
                  <OrderThumb src={order.productImage} alt={order.productName} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-neutral-700" title={order.productName}>
                    {order.productName}
                  </p>
                  <p className="text-[11px] text-neutral-900 font-bold">
                    ৳{order.total.toLocaleString("en-BD")}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-3 flex items-center justify-end gap-1">
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="my-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E1D5] bg-[#FAF8F5] p-6 text-center">
          <ShoppingBag className="size-6 text-neutral-400" />
          <p className="mt-2 text-xs font-semibold text-neutral-700">No orders yet</p>
          <p className="mt-1 text-[11px] text-neutral-400">
            Orders placed by customers will appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
}
