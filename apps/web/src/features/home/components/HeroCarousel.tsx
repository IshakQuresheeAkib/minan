"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { Navbar } from "@/components/shared/navbar";
import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL = 5000;
const ANIM_DURATION = 0.65;

const slides = [
  {
    id: "promo-sale",
    tag: "Limited Offer",
    heading: ["40%", "Off Now"],
    body: "Discover our exclusive collection at unbeatable prices. Fresh styles, bold looks.",
    cta: "Shop Now",
    href: publicRoutes.products,
    // Mobile card data
    mobileLines: ["40%", "Off, Shop", "Fashion Now!"],
    mobileVariant: "primary" as const,
  },
  {
    id: "promo-new",
    tag: "New Season",
    heading: ["New", "Arrivals"],
    body: "Be the first to explore styles fresh from our latest drops this week.",
    cta: "Explore",
    href: publicRoutes.products,
    mobileLines: ["New", "Arrivals", "This Week"],
    mobileVariant: "secondary" as const,
  },
] as const;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialise slides: first visible, rest hidden
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        x: 0,
        zIndex: i === 0 ? 10 : 0,
      });
    });
  }, []);

  const goTo = useCallback(
    (nextIndex: number, dir: "next" | "prev" = "next") => {
      if (isAnimatingRef.current) return;
      if (nextIndex === currentRef.current) return;

      const outEl = slideRefs.current[currentRef.current];
      const inEl = slideRefs.current[nextIndex];
      if (!outEl || !inEl) return;

      isAnimatingRef.current = true;

      const xOut = dir === "next" ? -70 : 70;
      const xIn = dir === "next" ? 70 : -70;

      gsap.set(inEl, { x: xIn, opacity: 0, zIndex: 10 });

      gsap.to(outEl, {
        x: xOut,
        opacity: 0,
        duration: ANIM_DURATION,
        ease: "power2.inOut",
        onComplete: () => gsap.set(outEl, { zIndex: 0 }),
      });

      gsap.to(inEl, {
        x: 0,
        opacity: 1,
        duration: ANIM_DURATION,
        ease: "power2.inOut",
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      });

      currentRef.current = nextIndex;
      setCurrent(nextIndex);
    },
    [],
  );

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % slides.length;
      goTo(next, "next");
    }, SLIDE_INTERVAL);
  }, [goTo]);

  // Auto-slide
  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  const handlePrev = () => {
    const prev = (currentRef.current - 1 + slides.length) % slides.length;
    goTo(prev, "prev");
    resetInterval();
  };

  const handleNext = () => {
    const next = (currentRef.current + 1) % slides.length;
    goTo(next, "next");
    resetInterval();
  };

  const handleDot = (index: number) => {
    const dir = index > currentRef.current ? "next" : "prev";
    goTo(index, dir);
    resetInterval();
  };

  return (
    <section
      aria-label="Promotions"
      className="relative overflow-x-clip lg:overflow-visible"
    >
      <Navbar overlay />
      {/* ── Mobile: horizontal scroll cards ── */}
      <div className="mt-4 mb-12 w-full overflow-x-auto overscroll-x-contain px-4 hide-scrollbar lg:hidden">
        <div className="flex min-w-max gap-4">
          {slides.map((slide) => (
            <article
              key={slide.id}
              className={cn(
                "relative h-48 w-80 overflow-hidden rounded-3xl",
                slide.mobileVariant === "primary"
                  ? "bg-accent"
                  : "bg-secondary/60",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 z-10 flex w-2/3 flex-col justify-center p-6",
                  slide.mobileVariant === "primary"
                    ? "bg-linear-to-r from-accent/90 to-transparent"
                    : "bg-linear-to-r from-secondary/80 to-transparent",
                )}
              >
                {/* <h2 className="mb-2 font-display text-3xl font-bold leading-tight text-primary">
                  {slide.mobileLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <Link
                  href={slide.href}
                  className="w-max cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition-opacity hover:opacity-90"
                >
                  {slide.cta}
                </Link> */}
              </div>
              <div
                className="absolute right-0 top-0 h-full w-2/3 bg-muted"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </div>

      {/* ── Desktop: full-screen GSAP carousel ── */}
      <div
        className="relative hidden w-full overflow-hidden lg:block"
        style={{ height: "90svh" }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="absolute inset-0"
            aria-hidden={index !== current}
          >
            {/* Background gradient layer */}
            <div
              className={cn(
                "absolute inset-0",
                index === 0
                  ? "bg-linear-to-br from-accent/35 via-primary/10 to-background"
                  : "bg-linear-to-br from-secondary/40 via-accent/15 to-background",
              )}
            />

            {/* Right decorative panel */}
            <div className="absolute right-0 top-0 h-full w-[52%] overflow-hidden">
              <div
                className={cn(
                  "h-full w-full",
                  index === 0 ? "bg-accent/25" : "bg-secondary/25",
                  "[clip-path:polygon(12%_0%,100%_0%,100%_100%,0%_100%)]",
                )}
              />
            </div>

            {/* Placeholder image frame — swap src with Cloudinary URL */}
            <div
              aria-hidden="true"
              className="absolute right-[6%] top-1/2 flex h-[68%] w-[36%] -translate-y-1/2 items-center justify-center overflow-hidden rounded-3xl border border-border/20 bg-muted/50 shadow-xl backdrop-blur-xs"
            >
              <span className="select-none font-display text-xs font-medium uppercase tracking-widest text-muted-foreground/30">
                Hero Image
              </span>
            </div>

            {/* Text content */}
            <div className="absolute inset-0 flex items-center lg:pt-20">
              <div className="mx-auto w-full max-w-7xl px-16">
                <div className="max-w-xl">
                  <span
                    className={cn(
                      "mb-5 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest",
                      index === 0
                        ? "border border-primary/30 bg-primary/10 text-primary"
                        : "border border-secondary-foreground/20 bg-secondary/30 text-secondary-foreground",
                    )}
                  >
                    {slide.tag}
                  </span>
                  <h2 className="mb-5 font-display text-[clamp(3.5rem,6vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-foreground">
                    {slide.heading.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </h2>
                  <p className="mb-9 max-w-md text-base leading-relaxed text-muted-foreground">
                    {slide.body}
                  </p>
                  <Link
                    href={slide.href}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full px-8 py-4 text-sm font-bold tracking-wide transition-all duration-200 hover:shadow-lg",
                      index === 0
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25"
                        : "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 hover:shadow-foreground/10",
                    )}
                  >
                    {slide.cta}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Left arrow */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-6 top-1/2 z-20 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-card/75 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-card hover:shadow-lg"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        {/* Right arrow */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-6 top-1/2 z-20 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-card/75 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-card hover:shadow-lg"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>

        {/* Dot navigation */}
        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
          role="group"
          aria-label="Slide navigation"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleDot(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              className={cn(
                "cursor-pointer rounded-full transition-all duration-300",
                index === current
                  ? "h-2.5 w-8 bg-primary"
                  : "size-2.5 bg-foreground/20 hover:bg-foreground/40",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
