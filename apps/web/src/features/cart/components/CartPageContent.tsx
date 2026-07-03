"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { useCartStore } from "@/store/cart.store";

function formatCurrency(value: number): string {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

export function CartPageContent() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  if (!hasHydrated) {
    return (
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div>
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="mt-6 grid gap-4">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border bg-card p-3 shadow-sm sm:grid-cols-[104px_1fr_auto]"
              >
                <div className="aspect-square animate-pulse rounded-md bg-muted" />
                <div className="space-y-3 py-1">
                  <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="col-span-2 h-10 animate-pulse rounded-md bg-muted sm:col-span-1 sm:w-28" />
              </div>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg border bg-card p-5 shadow-sm">
          <div className="h-6 w-36 animate-pulse rounded-md bg-muted" />
          <div className="mt-5 h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="mt-5 h-11 w-full animate-pulse rounded-md bg-muted" />
        </aside>
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
          Your cart is empty
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
          Add your preferred items before starting checkout.
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
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Cart</h1>
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article
              key={item.lineId}
              className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border bg-card p-3 text-foreground shadow-sm sm:grid-cols-[104px_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="104px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <h2 className="line-clamp-2 text-base font-semibold">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                  {item.size} / {item.color}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formatCurrency(item.price)}
                </p>
              </div>

              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                <div className="flex h-10 items-center rounded-md border bg-background">
                  <Button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    variant="secondary"
                    size="icon"
                    className="size-10 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted hover:text-foreground hover:shadow-none disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      updateQuantity(item.lineId, item.quantity - 1)
                    }
                    icon={<Minus className="size-4" aria-hidden="true" />}
                  />
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    variant="secondary"
                    size="icon"
                    className="size-10 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted hover:text-foreground hover:shadow-none"
                    onClick={() =>
                      updateQuantity(item.lineId, item.quantity + 1)
                    }
                    icon={<Plus className="size-4" aria-hidden="true" />}
                  />
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  className="flex size-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-destructive"
                  onClick={() => removeItem(item.lineId)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-lg border bg-card p-5 text-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-foreground/70">Items</span>
          <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Button
          className="mt-5 h-11 w-full"
          href={publicRoutes.checkout}
          text="Proceed to checkout"
        />
      </aside>
    </section>
  );
}
