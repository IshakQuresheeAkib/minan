import Link from "next/link";

import { Button } from "@/components/ui/button";

const highlights = ["T-Shirts", "Shirts", "Pants", "Footwear", "Accessories"] as const;

export function HeroCarousel() {
  return (
    <section className="border-b bg-[linear-gradient(135deg,var(--background),var(--secondary)_55%,var(--accent))]">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase text-muted-foreground">Sylhet drop</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            Premium everyday wear, ready for fast ordering.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Browse selected styles, add to cart, and confirm delivery details without slowing down the purchase intent.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border bg-background/70 p-4 shadow-sm backdrop-blur">
          {highlights.map((highlight) => (
            <div key={highlight} className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
              <span className="text-sm font-medium">{highlight}</span>
              <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
