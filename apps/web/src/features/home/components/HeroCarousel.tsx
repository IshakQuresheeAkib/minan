import Link from "next/link";

import { publicRoutes } from "@/constants/routes";

const banners = [
  {
    id: "promo-40",
    lines: ["40%", "Off, Shop", "Fashion Now!"],
    cta: "Shop Now",
    href: publicRoutes.products,
    variant: "primary" as const,
  },
  {
    id: "promo-new",
    lines: ["New", "Arrivals", "This Week"],
    cta: "Explore",
    href: publicRoutes.products,
    variant: "secondary" as const,
  },
] as const;

export function HeroCarousel() {
  return (
    <section
      aria-label="Promotions"
      className="-mx-4 mb-12 overflow-x-auto hide-scrollbar px-4"
    >
      <div className="flex min-w-max gap-4">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className={
              banner.variant === "primary"
                ? "relative h-48 w-80 overflow-hidden rounded-3xl bg-accent"
                : "relative h-48 w-80 overflow-hidden rounded-3xl bg-secondary/60"
            }
          >
            <div
              className={
                banner.variant === "primary"
                  ? "absolute inset-0 z-10 flex w-2/3 flex-col justify-center bg-linear-to-r from-accent/90 to-transparent p-6"
                  : "absolute inset-0 z-10 flex w-2/3 flex-col justify-center bg-linear-to-r from-secondary/80 to-transparent p-6"
              }
            >
              <h2 className="mb-2 font-display text-3xl font-bold leading-tight text-primary">
                {banner.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <Link
                href={banner.href}
                className="w-max cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition-opacity hover:opacity-90"
              >
                {banner.cta}
              </Link>
            </div>
            <div
              className="absolute right-0 top-0 h-full w-2/3 bg-muted"
              aria-hidden="true"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
