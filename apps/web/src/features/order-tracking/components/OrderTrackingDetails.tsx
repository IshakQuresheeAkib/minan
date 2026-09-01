"use client";

import {
  Check,
  CircleDot,
  Clock3,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBdt, formatTrackingDate, buildTrackingJourney } from "@/features/order-tracking/lib/trackingPresentation";
import type { CustomerOrderTracking } from "@/features/order-tracking/lib/types";

type OrderTrackingDetailsProps = {
  order: CustomerOrderTracking;
};

export function OrderTrackingDetails({ order }: OrderTrackingDetailsProps) {
  const journey = buildTrackingJourney(order);

  return (
    <article className="grid gap-5">
      <header className="overflow-hidden rounded-2xl border border-primary/35 bg-foreground px-5 py-6 text-background shadow-lg shadow-foreground/10 sm:px-7">
        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Order tracking</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">{order.current_stage.label}</h1>
            <p className="mt-1 text-sm leading-6 text-background/75">{order.current_stage.helper_text_bn}</p>
          </div>
          <Badge className="border-primary/45 bg-primary text-foreground">{order.order_id}</Badge>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-background p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="size-4 text-primary" aria-hidden="true" />
            Estimated delivery
          </div>
          <p className="mt-2 text-xl font-semibold tracking-normal">
            {order.expected_delivery_date ? formatTrackingDate(order.expected_delivery_date) : "To be confirmed"}
          </p>
          <p className="mt-1 text-sm text-foreground/65">ডেলিভারির সম্ভাব্য তারিখ</p>
        </section>
        <section className="rounded-2xl border bg-background p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Truck className="size-4 text-primary" aria-hidden="true" />
            Courier tracking
          </div>
          <p className="mt-2 text-xl font-semibold tracking-normal">
            {order.courier.name ?? "Courier details pending"}
          </p>
          <p className="mt-1 break-all text-sm text-foreground/65">
            {order.courier.tracking_code ? `Tracking code: ${order.courier.tracking_code}` : "Tracking code will appear after dispatch."}
          </p>
        </section>
      </div>

      <section aria-labelledby="tracking-timeline-heading" className="rounded-2xl border bg-background p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <PackageCheck className="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 id="tracking-timeline-heading" className="text-lg font-semibold tracking-normal">Delivery timeline</h2>
            <p className="text-sm text-foreground/65">অর্ডারের সর্বশেষ আপডেট</p>
          </div>
        </div>
        <ol className="mt-6 grid gap-0">
          {journey.map((entry, index) => (
            <li key={entry.stage} className="grid grid-cols-[1.75rem_1fr] gap-3">
              <div className="relative flex justify-center">
                {index < journey.length - 1 ? <span aria-hidden="true" className="absolute top-7 bottom-0 w-px bg-secondary" /> : null}
                <span
                  aria-hidden="true"
                  className={entry.state === "upcoming"
                    ? "relative z-1 mt-0.5 flex size-7 items-center justify-center rounded-full border-2 border-secondary bg-background text-foreground/45"
                    : entry.state === "current"
                      ? "relative z-1 mt-0.5 flex size-7 items-center justify-center rounded-full bg-primary text-foreground"
                      : "relative z-1 mt-0.5 flex size-7 items-center justify-center rounded-full bg-foreground text-background"}
                >
                  {entry.state === "complete" ? <Check className="size-4" /> : <CircleDot className="size-4" />}
                </span>
              </div>
              <div className={index < journey.length - 1 ? "pb-6" : ""}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="font-semibold">{entry.label}</h3>
                  {entry.state === "current" ? <Badge variant="secondary">Current update</Badge> : null}
                </div>
                <p className="mt-1 text-sm leading-6 text-foreground/65">{entry.helperTextBn}</p>
                {entry.createdAt ? <p className="mt-1 text-xs font-medium text-foreground/50">{formatTrackingDate(entry.createdAt)}</p> : null}
                {entry.customerNote ? <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-foreground">{entry.customerNote}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="order-summary-heading" className="rounded-2xl border bg-background p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 id="order-summary-heading" className="text-lg font-semibold tracking-normal">Order summary</h2>
            <p className="text-sm text-foreground/65">{order.shipping.city ? `${order.shipping.city} · ${order.shipping.area}` : order.shipping.area}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3 border-y py-4">
          {order.items.map((item, index) => (
            <li key={`${item.name}-${item.size}-${item.color}-${index}`} className="flex items-start justify-between gap-4 text-sm">
              <span className="min-w-0"><span className="font-medium">{item.name}</span><span className="block text-foreground/65">{item.size} · {item.color}</span></span>
              <span className="shrink-0 text-foreground/65">×{item.quantity}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2 text-sm">
          {order.payment_method_label ? <div className="flex justify-between gap-4"><dt className="text-foreground/65">Payment method</dt><dd className="text-right font-medium">{order.payment_method_label}</dd></div> : null}
          <div className="flex justify-between gap-4 text-base"><dt className="font-semibold">Order value</dt><dd className="font-semibold">{formatBdt(order.totals.overall_order_value)}</dd></div>
        </dl>
      </section>
    </article>
  );
}
