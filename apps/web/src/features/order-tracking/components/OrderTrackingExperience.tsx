"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { OrderTrackingDetails } from "@/features/order-tracking/components/OrderTrackingDetails";
import { PublicOrderLookup } from "@/features/order-tracking/components/PublicOrderLookup";
import { restoreCustomerSession } from "@/features/order-tracking/lib/customerSession";
import {
  getCustomerOrder,
  OrderTrackingApiError,
} from "@/features/order-tracking/lib/orderTrackingApi";
import { getOrderTrackingLoginHref } from "@/features/order-tracking/lib/trackingPresentation";
import type { CustomerOrderTracking } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

function errorMessage(error: unknown): string {
  if (error instanceof OrderTrackingApiError && error.status === 401) {
    return "This order is not available for your account. Sign in again and check the order number.";
  }
  return error instanceof OrderTrackingApiError
    ? error.message
    : "Unable to load this order. Please try again.";
}

function TrackingDetail({ orderNumber }: { orderNumber: string }) {
  const { clearSession, session, status } = useCustomerAuthStore();
  const [order, setOrder] = useState<CustomerOrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unknown" || !session) return;

    let active = true;
    const load = getCustomerOrder(orderNumber, session.accessToken);
    void load
      .then((nextOrder) => {
        if (active) setOrder(nextOrder);
      })
      .catch((loadError: unknown) => {
        if (active && loadError instanceof OrderTrackingApiError && loadError.status === 401) {
          clearSession();
        }
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession, orderNumber, session, status]);

  const loginHref = getOrderTrackingLoginHref(orderNumber);
  const signInRequired = status !== "unknown" && !session;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={publicRoutes.orderTracking} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none">
        <ArrowLeft className="size-4" aria-hidden="true" /> Track another order
      </Link>
      <div className="mt-5" aria-live="polite">
        {signInRequired ? <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5" role="alert"><p className="font-semibold">Sign in to view this order</p><p className="mt-1 text-sm leading-6 text-foreground/75">This order can be opened only from the MINAN account that owns it.</p><Button href={loginHref} className="mt-4">Sign in to Orders</Button></div> : null}
        {!signInRequired && loading ? <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border bg-background text-sm text-foreground/65" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your order…</div> : null}
        {!signInRequired && error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5" role="alert"><p className="font-semibold">We could not open this order</p><p className="mt-1 text-sm leading-6 text-foreground/75">{error}</p></div> : null}
        {!signInRequired && order ? <OrderTrackingDetails order={order} /> : null}
      </div>
    </section>
  );
}

export function OrderTrackingExperience({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const { status } = useCustomerAuthStore();

  useEffect(() => {
    if (status === "unknown") {
      void restoreCustomerSession().catch(() => {
        // The account panel presents the safe recovery path after a failed refresh.
      });
    }
  }, [status]);

  if (orderNumber) {
    return <TrackingDetail key={orderNumber} orderNumber={orderNumber} />;
  }

  return <PublicOrderLookup />;
}
