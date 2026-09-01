"use client";

import { LogOut, Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { publicRoutes } from "@/constants/routes";
import { logoutCustomer } from "@/features/order-tracking/lib/orderTrackingApi";
import { useCustomerAuthStore } from "@/store/customer-auth.store";

export function CustomerOrderLookup() {
  const formId = useId();
  const router = useRouter();
  const { clearSession, session, status } = useCustomerAuthStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await logoutCustomer();
    } finally {
      clearSession();
      setBusy(false);
      router.replace(publicRoutes.orderTracking);
      router.refresh();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/orders?order=${encodeURIComponent(orderNumber)}&access=account`);
  }

  if (status === "unknown") {
    return <p className="text-sm text-foreground/65" role="status">Checking your account session…</p>;
  }

  if (!session) {
    return (
      <div className="grid gap-3">
        <p className="text-sm leading-6 text-foreground/70">Sign in with your MINAN account to view an order that is already yours.</p>
        <Button href={`${publicRoutes.customerLogin}?next=${encodeURIComponent(publicRoutes.orderTracking)}`}>Sign in to Orders</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/35 px-3 py-2 text-sm">
        <span className="min-w-0 truncate font-medium">Signed in as {session.customer.email}</span>
        <button type="button" className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4 focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none" onClick={() => void signOut()} disabled={busy}>
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </div>
      <form noValidate className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-medium" htmlFor={`${formId}-order`}>
          Order number
          <Input id={`${formId}-order`} autoComplete="off" required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="MN-YYYYMMDD-####" />
        </label>
        <Button type="submit" leftIcon={<Search className="size-4" aria-hidden="true" />}>View my order</Button>
      </form>
    </div>
  );
}
