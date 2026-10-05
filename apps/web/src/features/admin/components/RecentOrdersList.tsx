"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { adminRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { RecentOrderSummary } from "@/features/admin/types";

function getStatusBadge(status: string) {
  switch (status) {
    case "delivered":
      return {
        label: "Delivered",
        className: "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]",
      };
    case "shipped":
      return {
        label: "Shipped",
        className: "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]",
      };
    case "processing":
      return {
        label: "Processing",
        className: "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-[#EBF5FB] text-[#2980B9] border-[#D4E6F1]",
      };
    case "new":
      return {
        label: "New",
        className: "bg-[#F4ECF7] text-[#8E44AD] border-[#E8DAEF]",
      };
    case "returned":
    case "exchanged":
      return {
        label: status === "returned" ? "Returned" : "Exchanged",
        className: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-neutral-100 text-neutral-600 border-neutral-200",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        className: "bg-[#FAF7F2] text-neutral-700 border-[#E8E1D5]",
      };
  }
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
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
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[#E8E1D5]/70 bg-white/95 p-6 shadow-[0_4px_20px_-4px_rgba(40,30,20,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight text-[#1A1715]">
            Recent Orders
          </h2>
          <span className="inline-flex items-center rounded-full bg-[#FAF5EE] px-2 py-0.5 text-[10px] font-semibold text-[#8C7A6B]">
            Latest {orders.length}
          </span>
        </div>
        <Link
          href={adminRoutes.orders}
          className="group inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <span>View all orders</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table / List Header */}
      <div className="mt-4 grid grid-cols-12 border-b border-[#EFE8DC] pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        <div className="col-span-4">Customer</div>
        <div className="col-span-5">Product</div>
        <div className="col-span-3 text-right">Status</div>
      </div>

      {/* Rows */}
      {orders.length > 0 ? (
        <div className="divide-y divide-[#F5EFEB]/80">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <Link
                key={order.id}
                href={`${adminRoutes.orders}/${order.id}`}
                className="group grid grid-cols-12 items-center py-3 text-xs transition-colors hover:bg-[#FAF7F2]/60 rounded-xl px-1"
              >
                {/* Customer Avatar + Name */}
                <div className="col-span-4 flex items-center gap-2.5 overflow-hidden pr-2">
                  <CustomerAvatar name={order.customerName} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#1A1715]" title={order.customerName}>
                      {order.customerName}
                    </p>
                    <p className="truncate text-[10px] text-neutral-400">
                      {order.orderNumber}
                    </p>
                  </div>
                </div>

                {/* Product Thumbnail + Name */}
                <div className="col-span-5 flex items-center gap-2.5 overflow-hidden pr-2">
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-[#EAE2D5] border border-[#E0D7C9]">
                    <Image
                      src={order.productImage}
                      alt={order.productName}
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-800" title={order.productName}>
                      {order.productName}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-semibold">
                      ৳{order.total.toLocaleString("en-BD")}
                    </p>
                  </div>
                </div>

                {/* Status & Chevron */}
                <div className="col-span-3 flex items-center justify-end gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide capitalize",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                  <ChevronRight className="size-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E1D5] bg-[#FAF8F5] p-6 text-center">
          <ShoppingBag className="size-6 text-neutral-400" />
          <p className="mt-2 text-xs font-semibold text-neutral-700">No orders yet</p>
          <p className="mt-1 text-[11px] text-neutral-400">Orders placed by customers will appear here in real-time.</p>
        </div>
      )}
    </div>
  );
}
