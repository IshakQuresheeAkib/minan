"use client";

import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { publicRoutes } from "@/constants/routes";
import { OrderTrackingDetails } from "@/features/order-tracking/components/OrderTrackingDetails";
import { OrderTrackingApiError, searchPublicOrders } from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderSummary, CustomerOrderTracking, PublicOrderSearchResult } from "@/features/order-tracking/lib/types";

function orderSummaryLabel(order: CustomerOrderSummary): string {
  return `${order.order_id} · ${order.current_stage.label}`;
}

export function PublicOrderLookup() {
  const requestVersion = useRef(0);
  const [query, setQuery] = useState("");
  const [phoneResult, setPhoneResult] = useState<Extract<PublicOrderSearchResult, { kind: "phone" }> | null>(null);
  const [order, setOrder] = useState<CustomerOrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(nextQuery: string, cursor?: string, append = false): Promise<void> {
    const version = ++requestVersion.current;
    setLoading(true); setError(null);
    if (!append) { setOrder(null); setPhoneResult(null); }
    try {
      const result = await searchPublicOrders(nextQuery, cursor);
      if (version !== requestVersion.current) return;
      if (result.kind === "order") { setOrder(result.order); return; }
      setPhoneResult((previous) => append && previous
        ? { ...result, orders: [...previous.orders, ...result.orders] }
        : result);
    } catch (searchError) {
      if (version !== requestVersion.current) return;
      setError(searchError instanceof OrderTrackingApiError && searchError.status === 404
        ? "We could not find an order for those details."
        : "We could not complete that lookup. Please try again.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void runSearch(query);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.18em] text-foreground/60 uppercase">MINAN order desk</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Find an order update.</h1><p className="mt-4 text-sm leading-7 text-foreground/70">Enter an Order number or the Bangladesh phone number used at checkout. অর্ডার নম্বর বা মোবাইল নম্বর দিয়ে খুঁজুন।</p></div>
      <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <label className="sr-only" htmlFor="public-order-query">Order number or phone number</label>
        <Input id="public-order-query" autoComplete="off" className="h-12 flex-1" placeholder="MN-YYYYMMDD-#### or 01XXXXXXXXX" required value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button className="h-12 sm:min-w-32" loading={loading} loadingText="Looking up..." type="submit" leftIcon={<Search className="size-4" aria-hidden="true" />}>Lookup</Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-foreground/60">For privacy, phone results are kept only on this page and clear when you reload.</p>
      <Link className="mt-4 inline-flex text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4" href="/account/orders">My Orders</Link>
      <div className="mt-6" aria-live="polite">
        {loading ? <p className="flex items-center gap-2 text-sm text-foreground/65" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Searching for your order…</p> : null}
        {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</p> : null}
        {order ? <div><OrderTrackingDetails order={order} /><p className="mt-5 rounded-xl border border-primary/35 bg-primary/10 p-4 text-sm leading-6">Want to save this Order? <Link className="font-semibold underline" href={`${publicRoutes.customerLogin}?next=${encodeURIComponent(publicRoutes.orderTracking)}`}>Sign in, then verify the checkout email code.</Link></p></div> : null}
        {phoneResult ? <section aria-labelledby="phone-history-heading" className="rounded-2xl border bg-background p-5 sm:p-7"><h2 id="phone-history-heading" className="text-xl font-semibold">Orders for this phone number</h2><ul className="mt-5 grid gap-3">{phoneResult.orders.map((summary) => <li key={summary.order_id}><button type="button" className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none" onClick={() => { setQuery(summary.order_id); void runSearch(summary.order_id); }}><span><span className="block font-semibold">{orderSummaryLabel(summary)}</span><span className="mt-1 block text-sm text-foreground/65">{summary.total_item_quantity} item{summary.total_item_quantity === 1 ? "" : "s"} · Tk {summary.overall_order_value.toLocaleString("en-BD")}</span></span><span className="text-sm font-semibold">View</span></button></li>)}</ul>{phoneResult.next_cursor ? <Button className="mt-5" type="button" variant="secondary" disabled={loading} onClick={() => void runSearch(query, phoneResult.next_cursor ?? undefined, true)}>Load more</Button> : <p className="mt-5 text-sm text-foreground/60">All Orders for this phone number are shown.</p>}</section> : null}
      </div>
    </section>
  );
}
