"use client";

import { ShoppingBag } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { LeadForm } from "@/features/checkout/components/LeadForm";
import type { CartSnapshot } from "@/features/checkout/types";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import { useCartPricingSync } from "@/features/products/hooks/useCartPricingSync";
import { useCartStore } from "@/store/cart.store";

function formatCurrency(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

export function CheckoutClient() {
  useCartPricingSync();
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const savings = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
        0,
      ),
    [items],
  );
  const hasUnavailableItems = items.some((item) => !item.isAvailable);

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

  if (!hasHydrated) {
    return (
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <div className="minan-skeleton h-9 w-36 rounded-md" />
          <div className="minan-skeleton mt-3 h-5 w-full max-w-xl rounded-md" />
          <div className="mt-8 grid gap-5">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="minan-skeleton h-12 rounded-md"
              />
            ))}
            <div className="minan-skeleton h-28 rounded-md" />
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-foreground/10 bg-background p-5 shadow-sm">
          <div className="minan-skeleton h-6 w-36 rounded-md" />
          <div className="mt-5 grid gap-4">
            {[0, 1].map((item) => (
              <div key={item} className="flex justify-between gap-4">
                <div className="minan-skeleton h-10 flex-1 rounded-md" />
                <div className="minan-skeleton h-5 w-20 rounded-md" />
              </div>
            ))}
          </div>
          <div className="minan-skeleton mt-5 h-5 w-full rounded-md" />
        </aside>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-background">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">
          Checkout needs cart items
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
          Add products to your cart before sharing delivery details.
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
        <h1 className="text-3xl font-semibold tracking-normal">Checkout</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
          Share your delivery details, then complete payment securely with bKash.
        </p>
        <LeadForm
          cartSnapshot={cartSnapshot}
          checkoutSource="cart"
          disabled={hasUnavailableItems}
        />
        {hasUnavailableItems ? (
          <p className="mt-3 text-sm font-medium text-destructive">
            Remove unavailable products from your cart before submitting.
          </p>
        ) : null}
      </div>

      <aside className="h-fit rounded-lg border bg-background p-5 text-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 grid gap-4">
          {items.map((item) => (
            <div
              key={item.lineId}
              className="flex justify-between gap-4 text-sm"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 font-medium">{item.name}</p>
                <p className="mt-1 text-xs text-foreground/70">
                  {item.size} / {item.color} x {item.quantity}
                </p>
              </div>
              <ProductPrice
                className="shrink-0 justify-end"
                price={item.price * item.quantity}
                originalPrice={item.originalPrice * item.quantity}
                discount={item.discount}
                size="sm"
              />
            </div>
          ))}
        </div>
        {savings > 0 ? (
          <div className="mt-4 flex items-center justify-between text-sm font-semibold">
            <span>You save</span>
            <span>{formatCurrency(savings)}</span>
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </aside>
    </section>
  );
}
