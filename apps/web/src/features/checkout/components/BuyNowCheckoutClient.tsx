"use client";

import { CheckCircle2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { LeadForm } from "@/features/checkout/components/LeadForm";
import type { CartSnapshot } from "@/features/checkout/types";
import { useBuyNowStore } from "@/store/buy-now.store";

function formatCurrency(value: number): string {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

export function BuyNowCheckoutClient() {
  const item = useBuyNowStore((state) => state.item);
  const hasHydrated = useBuyNowStore((state) => state.hasHydrated);
  const clearItem = useBuyNowStore((state) => state.clearItem);
  const [submitted, setSubmitted] = useState(false);

  const total = item ? item.price * item.quantity : 0;
  const cartSnapshot = useMemo<CartSnapshot | null>(() => {
    if (!item) {
      return null;
    }

    return {
      items: [
        {
          product_id: item.productId,
          name: item.name,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        },
      ],
      total,
    };
  }, [item, total]);

  if (submitted) {
    return (
      <section className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
        <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-semibold tracking-normal">
          Request received
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
          MINAN will contact you to confirm availability, delivery, and payment.
        </p>
        <Button
          className="mt-6"
          href={publicRoutes.products}
          text="Continue shopping"
        />
      </section>
    );
  }

  if (!hasHydrated) {
    return (
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <div className="h-9 w-52 animate-pulse rounded-md bg-background" />
          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-md bg-background" />
          <div className="mt-8 grid gap-5">
            {[0, 1, 2, 3].map((field) => (
              <div
                key={field}
                className="h-12 animate-pulse rounded-md bg-background"
              />
            ))}
            <div className="h-28 animate-pulse rounded-md bg-background" />
          </div>
        </div>

        <aside className="h-fit rounded-lg border bg-background p-5 shadow-sm">
          <div className="h-6 w-36 animate-pulse rounded-md bg-background" />
          <div className="mt-5 h-20 animate-pulse rounded-md bg-background" />
          <div className="mt-5 h-5 w-full animate-pulse rounded-md bg-background" />
        </aside>
      </section>
    );
  }

  if (!item || !cartSnapshot) {
    return (
      <section className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-background">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">
          Buy Now item unavailable
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
          Choose a product again to start an immediate checkout.
        </p>
        <Button
          className="mt-6"
          href={publicRoutes.products}
          text="Browse products"
        />
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Buy Now Checkout
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
          Complete checkout for this selected item. Your cart stays unchanged.
        </p>
        <LeadForm
          cartSnapshot={cartSnapshot}
          onSuccess={() => {
            clearItem();
            setSubmitted(true);
          }}
        />
      </div>

      <aside className="h-fit rounded-lg border bg-background p-5 text-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-background">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="80px"
                className="object-cover object-top"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium">{item.name}</p>
            <p className="mt-1 text-xs text-foreground/70">
              {item.size} / {item.color} x {item.quantity}
            </p>
            <p className="mt-2 font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </aside>
    </section>
  );
}
