"use client";

import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { restoreCustomerSession } from "@/features/order-tracking/lib/customerSession";
import { getCustomerOrders, logoutCustomer, OrderTrackingApiError } from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderHistoryPage } from "@/features/order-tracking/lib/types";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function CustomerOrderHistory() {
  const { clearSession, session, status } = useCustomerAuthStore();
  const [page, setPage] = useState<CustomerOrderHistoryPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unknown") void restoreCustomerSession().catch(() => undefined);
  }, [status]);
  useEffect(() => {
    if (!session) return;
    void getCustomerOrders(session.accessToken)
      .then(setPage)
      .catch((loadError: unknown) => {
        if (loadError instanceof OrderTrackingApiError && loadError.status === 401) clearSession();
        setError("We could not load your Order history. Please sign in again.");
      })
      .finally(() => setLoading(false));
  }, [clearSession, session]);

  async function loadMore(): Promise<void> {
    if (!session || !page?.next_cursor) return;
    setLoading(true);
    try {
      const next = await getCustomerOrders(session.accessToken, page.next_cursor);
      setPage({ ...next, orders: [...page.orders, ...next.orders] });
    } finally { setLoading(false); }
  }
  async function signOut(): Promise<void> { try { await logoutCustomer(); } finally { clearSession(); } }

  if (status === "unknown") return <main className="mx-auto max-w-3xl px-4 py-12" role="status">Checking your account…</main>;
  if (!session) return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-3xl font-semibold">My Orders</h1><p className="mt-3 text-foreground/70">Sign in to see Orders placed while signed in or individually saved afterward. Orders are never added by matching a phone number or email.</p><Button className="mt-6" href={`${publicRoutes.customerLogin}?next=${encodeURIComponent("/account/orders")}`}>Sign in</Button></main>;

  return <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-foreground/60 uppercase">MINAN account</p><h1 className="mt-2 text-3xl font-semibold">My Orders</h1></div><Button type="button" variant="secondary" leftIcon={<LogOut className="size-4" />} onClick={() => void signOut()}>Sign out</Button></div><p className="mt-4 text-sm leading-6 text-foreground/70">This history includes Orders placed while signed in or saved one at a time after email verification.</p>{loading && !page ? <p className="mt-8 flex gap-2" role="status"><Loader2 className="size-4 animate-spin" /> Loading Orders…</p> : null}{error ? <p className="mt-6 text-destructive" role="alert">{error}</p> : null}{page?.orders.length === 0 ? <p className="mt-8 rounded-xl border p-5 text-foreground/70">No Orders are saved to this account yet.</p> : null}<ul className="mt-6 grid gap-3">{page?.orders.map((order) => <li key={order.order_id}><Link className="block rounded-xl border p-4 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none" href={`/account/orders/${encodeURIComponent(order.order_id)}`}><span className="font-semibold">{order.order_id} · {order.current_stage.label}</span><span className="mt-1 block text-sm text-foreground/65">{order.total_item_quantity} items · Tk {order.overall_order_value.toLocaleString("en-BD")}</span></Link></li>)}</ul>{page?.next_cursor ? <Button className="mt-5" type="button" variant="secondary" disabled={loading} onClick={() => void loadMore()}>Load more</Button> : null}</main>;
}
