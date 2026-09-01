"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { OrderTrackingDetails } from "@/features/order-tracking/components/OrderTrackingDetails";
import { getCustomerOrder, OrderTrackingApiError } from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderTracking } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function CustomerOrderDetail({ orderNumber }: { orderNumber: string }) {
  const { clearSession, session, status } = useCustomerAuthStore();
  const [order, setOrder] = useState<CustomerOrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    void getCustomerOrder(orderNumber, session.accessToken).then(setOrder).catch((loadError: unknown) => {
      if (loadError instanceof OrderTrackingApiError && loadError.status === 401) clearSession();
      setError("This Order is not available for your account.");
    });
  }, [clearSession, orderNumber, session]);
  if (status === "unknown") return <main className="mx-auto max-w-3xl px-4 py-12" role="status">Checking your account…</main>;
  if (!session) return <main className="mx-auto max-w-3xl px-4 py-12"><p>Sign in to open your saved Orders.</p><Button className="mt-4" href="/account/login?next=%2Faccount%2Forders">Sign in</Button></main>;
  return <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12"><Link className="text-sm font-semibold underline" href="/account/orders">My Orders</Link>{error ? <p className="mt-6 text-destructive" role="alert">{error}</p> : order ? <div className="mt-5"><OrderTrackingDetails order={order} /></div> : <p className="mt-6" role="status">Loading your Order…</p>}</main>;
}
