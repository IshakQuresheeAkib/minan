"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { adminRoutes } from "@/constants/routes";
import { OrderStatusGuide } from "@/features/admin/components/OrderStatusGuide";
import type { AdminOrder } from "@/features/admin/types";
import { label, localDate } from "./types";

export function OrderHeader({ order }: { order: AdminOrder }) {
  return (
    <header className="space-y-4">
      <Link
        href={adminRoutes.orders}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/65 hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">
              {order.order_number}
            </h1>
            <Badge>{label(order.status)}</Badge>
            {order.duplicate_review_state === "pending" ? (
              <Badge variant="destructive">Possible duplicate</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-foreground/60">
            Created {localDate(order.createdAt)} · Revision {order.revision}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end max-sm:[&_[data-slot=button]]:px-4 max-sm:[&_[data-slot=button]]:py-2">
          <OrderStatusGuide />
          <Button
            href={`${adminRoutes.orders}/${order._id}/invoice`}
            variant="secondary"
            leftIcon={<Printer className="size-4" aria-hidden="true" />}
          >
            Invoice
          </Button>
          <Button
            href={`${adminRoutes.orders}/${order._id}/packing-slip`}
            variant="secondary"
          >
            Packing slip
          </Button>
        </div>
      </div>
    </header>
  );
}
