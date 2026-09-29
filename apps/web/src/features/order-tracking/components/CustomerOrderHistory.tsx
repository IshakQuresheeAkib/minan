"use client";

import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { restoreCustomerSession } from "@/features/order-tracking/lib/customerSession";
import {
  logoutCustomer,
} from "@/features/order-tracking/lib/orderTrackingApi";
import type { CustomerOrderHistoryPage } from "@/features/order-tracking/lib/types";
import {
  createCustomerOrderHistoryKeyLoader,
  fetchCustomerOrderHistoryPage,
  isCustomerOrderLoadMoreError,
  type CustomerOrderHistoryKeyLoader,
} from "@/features/order-tracking/lib/customerOrderHistorySWR";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function CustomerOrderHistory() {
  const { clearSession, session, status } = useCustomerAuthStore();
  const customerId = session?.customer.id ?? null;
  const getKey = useMemo(
    () => createCustomerOrderHistoryKeyLoader(customerId),
    [customerId],
  );
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    setSize,
    size,
  } = useSWRInfinite<CustomerOrderHistoryPage, unknown, CustomerOrderHistoryKeyLoader>(
    getKey,
    fetchCustomerOrderHistoryPage,
  );
  const pages = data ?? [];
  const orders = pages.flatMap((page) => page.orders);
  const lastPage = pages.at(-1);
  const isInitialError = Boolean(error && !data);
  const isLoadMoreError = isCustomerOrderLoadMoreError(error);
  const isRefreshError = Boolean(error && data && !isLoadMoreError);

  useEffect(() => {
    if (status === "unknown")
      void restoreCustomerSession().catch(() => undefined);
  }, [status]);

  async function signOut(): Promise<void> {
    try {
      await logoutCustomer();
    } finally {
      clearSession();
    }
  }

  if (status === "unknown")
    return (
      <main className="mx-auto max-w-3xl px-4 py-12" role="status">
        Checking your account…
      </main>
    );

  if (!session)
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">My Orders</h1>
        <p className="mt-3 text-foreground/70">
          Sign in to see Orders placed while signed in or individually saved
          afterward. Orders are never added by matching a phone number or email.
        </p>
        <Button
          className="mt-6"
          href={`${publicRoutes.customerLogin}?next=${encodeURIComponent("/account/orders")}`}
        >
          Sign in
        </Button>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-foreground/60 uppercase">
            MINAN account
          </p>
          <h1 className="mt-2 text-3xl font-semibold">My Orders</h1>
        </div>
        <Button
          type="button"
          variant="secondary"
          leftIcon={<LogOut className="size-4" />}
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </div>
      <p className="mt-4 text-sm leading-6 text-foreground/70">
        This history includes Orders placed while signed in or saved one at a
        time after email verification.
      </p>
      {isLoading && !data ? (
        <p className="mt-8 flex gap-2" role="status">
          <Loader2 className="size-4 animate-spin" /> Loading Orders…
        </p>
      ) : null}
      {isInitialError ? (
        <p className="mt-6 text-destructive" role="alert">
          We could not load your Order history. Please try again.
        </p>
      ) : null}
      {isRefreshError ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-destructive" role="alert">
          <span>We could not refresh your Order history.</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void mutate()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {data && orders.length === 0 ? (
        <p className="mt-8 rounded-xl border p-5 text-foreground/70">
          No Orders are saved to this account yet.
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3">
        {orders.map((order) => (
          <li key={order.order_id}>
            <Link
              className="block rounded-xl border p-4 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none"
              href={`/account/orders/${encodeURIComponent(order.order_id)}`}
            >
              <span className="font-semibold">
                {order.order_id} · {order.current_stage.label}
              </span>
              <span className="mt-1 block text-sm text-foreground/65">
                {order.total_item_quantity} items · Tk{" "}
                {order.overall_order_value.toLocaleString("en-BD")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {isLoadMoreError ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          <span>Failed to load additional Orders.</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void setSize(size)}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {lastPage?.next_cursor && !isLoadMoreError ? (
        <Button
          className="mt-5"
          type="button"
          variant="secondary"
          loading={isValidating}
          loadingText="Loading more..."
          disabled={isValidating}
          onClick={() => void setSize(size + 1)}
        >
          Load more
        </Button>
      ) : null}
    </main>
  );
}
