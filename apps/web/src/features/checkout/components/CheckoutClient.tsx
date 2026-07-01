"use client";

import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { publicRoutes } from "@/constants/routes";
import { LeadForm } from "@/features/checkout/components/LeadForm";
import type { CartSnapshot } from "@/features/checkout/types";
import { useCartStore } from "@/store/cart.store";

function formatCurrency(value: number): string {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

export function CheckoutClient() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [submitted, setSubmitted] = useState(false);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const cartSnapshot = useMemo<CartSnapshot>(
    () => ({
      items: items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        price: item.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
      total,
    }),
    [items, total],
  );

  if (submitted) {
    return (
      <section className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
        <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-semibold tracking-normal">
          Request received
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          MINAN will contact you to confirm availability, delivery, and payment.
        </p>
        <Button className="mt-6" asChild>
          <Link href={publicRoutes.products}>Continue shopping</Link>
        </Button>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">
          Checkout needs cart items
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Add products to your cart before sharing delivery details.
        </p>
        <Button className="mt-6" asChild>
          <Link href={publicRoutes.products}>Browse products</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Checkout</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Share delivery details and optional bKash transaction ID for manual confirmation.
        </p>
        <LeadForm
          cartSnapshot={cartSnapshot}
          onSuccess={() => {
            clearCart();
            setSubmitted(true);
          }}
        />
      </div>

      <aside className="h-fit rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 grid gap-4">
          {items.map((item) => (
            <div key={item.lineId} className="flex justify-between gap-4 text-sm">
              <div className="min-w-0">
                <p className="line-clamp-2 font-medium">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.size} / {item.color} x {item.quantity}
                </p>
              </div>
              <span className="shrink-0 font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </aside>
    </section>
  );
}
