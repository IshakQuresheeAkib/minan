import { MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

import { publicRoutes } from "@/constants/routes";
import { siteConfig } from "@/config/site.config";

export function BrandIntroSection() {
  return (
    <section
      aria-labelledby="brand-intro-heading"
      className="my-10 overflow-hidden rounded-2xl border border-primary/15 bg-card/50 p-6 sm:p-8 lg:my-14 lg:p-12"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Official Brand Store
          </div>
          <h2
            id="brand-intro-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            MINAN — Contemporary Fashion Crafted in Bangladesh
          </h2>
          <p className="text-base leading-relaxed text-foreground/80 sm:text-lg">
            Headquartered in Sylhet, MINAN designs modern wardrobe staples
            celebrating timeless tailoring and breathable everyday comfort. From
            signature festive Panjabis to premium casual shirts, trousers, and
            daily wear, every piece is made to elevate your personal style.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-foreground/70 sm:text-sm">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Store Location:{" "}
              <strong className="font-medium text-foreground">
                {siteConfig.streetAddress}, {siteConfig.city}
              </strong>
            </span>
          </div>

          <div className="pt-2">
            <Link
              href={publicRoutes.products}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Explore Full Collection
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5 lg:gap-4">
          <div className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-xs">
            <Truck className="size-5 text-primary" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Nationwide Delivery
            </h3>
            <p className="mt-1 text-xs leading-5 text-foreground/70">
              Expedited 24–48h delivery inside Sylhet, and 2–4 days across all 64
              districts of Bangladesh.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-xs">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Flexible Payments
            </h3>
            <p className="mt-1 text-xs leading-5 text-foreground/70">
              Secure online payment via bKash or convenient Cash on Delivery
              (COD) with advance delivery fee.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-xs sm:col-span-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Authentic Bangladeshi Craftsmanship
            </h3>
            <p className="mt-1 text-xs leading-5 text-foreground/70">
              Premium fabrics chosen for durability, breathable comfort in our
              climate, and precision stitching.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
