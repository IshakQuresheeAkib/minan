"use client";

import gsap from "gsap";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import { Navbar } from "@/components/shared/navbar";
import { publicRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL = 4000;
const ANIM_DURATION = 0.65;
const DRAG_THRESHOLD = 56;

const slides = [
  {
    id: "promo-sale",
    tag: "Limited Offer",
    heading: ["40%", "Off Now"],
    body: "Discover our exclusive collection at unbeatable prices. Fresh styles, bold looks.",
    cta: "Shop Now",
    href: publicRoutes.products,
    imageSrc: "/hero/limited-offer.jfif",
    imageAlt: "Golden fashion editorial look from MINAN",
    accent: "from-[#ff724b]/35 via-[#f5b836]/20 to-background",
    panel: "bg-[#f5b836]/30",
    stat: "2k+ looks",
  },
  {
    id: "promo-new",
    tag: "New Season",
    heading: ["New", "Arrivals"],
    body: "Be the first to explore styles fresh from our latest drops this week.",
    cta: "Explore",
    href: publicRoutes.products,
    imageSrc: "/hero/new-arrivals.jpg",
    imageAlt: "New season fashion arrivals styled for MINAN",
    accent: "from-[#fed65b]/40 via-[#ff724b]/15 to-background",
    panel: "bg-[#ff724b]/25",
    stat: "Fresh drop",
  },
] as const;

type Direction = "next" | "prev";

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    currentX: 0,
    isDragging: false,
  });

  useEffect(() => {
    slideRefs.current.forEach((el, index) => {
      if (!el) return;

      gsap.set(el, {
        opacity: index === 0 ? 1 : 0,
        x: 0,
        zIndex: index === 0 ? 10 : 0,
      });
      gsap.set(el.querySelectorAll(".hero-reveal"), {
        y: index === 0 ? 0 : 22,
        opacity: index === 0 ? 1 : 0,
      });
    });
  }, []);

  const goTo = useCallback(
    (nextIndex: number, direction: Direction = "next") => {
      if (isAnimatingRef.current) return;
      if (nextIndex === currentRef.current) return;

      const outEl = slideRefs.current[currentRef.current];
      const inEl = slideRefs.current[nextIndex];
      if (!outEl || !inEl) return;

      isAnimatingRef.current = true;

      const xOut = direction === "next" ? -70 : 70;
      const xIn = direction === "next" ? 70 : -70;
      const outgoingItems = outEl.querySelectorAll(".hero-reveal");
      const incomingItems = inEl.querySelectorAll(".hero-reveal");

      gsap.set(inEl, { x: xIn, opacity: 0, zIndex: 10 });
      gsap.set(incomingItems, { y: 26, opacity: 0 });

      gsap.to(outEl, {
        x: xOut,
        opacity: 0,
        duration: ANIM_DURATION,
        ease: "power2.inOut",
        onComplete: () => gsap.set(outEl, { zIndex: 0 }),
      });

      gsap.to(outgoingItems, {
        y: direction === "next" ? -16 : 16,
        opacity: 0,
        duration: ANIM_DURATION * 0.45,
        ease: "power2.out",
      });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(outgoingItems, { y: 22, opacity: 0 });
          isAnimatingRef.current = false;
        },
      });

      tl.to(
        inEl,
        {
          x: 0,
          opacity: 1,
          duration: ANIM_DURATION,
          ease: "power2.inOut",
        },
        0,
      ).to(
        incomingItems,
        {
          y: 0,
          opacity: 1,
          duration: ANIM_DURATION * 0.75,
          ease: "power3.out",
          stagger: 0.08,
        },
        0.18,
      );

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

  useEffect(() => {
    resetInterval();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  const handlePrev = useCallback(() => {
    const prev = (currentRef.current - 1 + slides.length) % slides.length;
    goTo(prev, "prev");
    resetInterval();
  }, [goTo, resetInterval]);

  const handleNext = useCallback(() => {
    const next = (currentRef.current + 1) % slides.length;
    goTo(next, "next");
    resetInterval();
  }, [goTo, resetInterval]);

  const handleDot = (index: number) => {
    const direction: Direction = index > currentRef.current ? "next" : "prev";
    goTo(index, direction);
    resetInterval();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("a, button")) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      currentX: event.clientX,
      isDragging: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;

    dragRef.current.currentX = event.clientX;
  };

  const endDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        !dragRef.current.isDragging ||
        dragRef.current.pointerId !== event.pointerId
      ) {
        return;
      }

      const distance = dragRef.current.currentX - dragRef.current.startX;
      dragRef.current.isDragging = false;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (Math.abs(distance) < DRAG_THRESHOLD) return;

      if (distance < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    },
    [handleNext, handlePrev],
  );

  return (
    <section aria-label="Promotions" className="relative overflow-hidden">
      <Navbar overlay />

      <div
        className="relative h-[680px] min-h-[640px] w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing lg:h-[90svh]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
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
            <div
              className={cn("absolute inset-0 bg-linear-to-br", slide.accent)}
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
            <div className="absolute right-0 top-0 hidden h-full w-[56%] overflow-hidden md:block">
              <div
                className={cn(
                  "h-full w-full [clip-path:polygon(12%_0%,100%_0%,100%_100%,0%_100%)]",
                  slide.panel,
                )}
              />
            </div>

            <div className="absolute inset-x-4 top-6 h-[300px] overflow-hidden rounded-[2rem] border border-white/25 bg-muted shadow-2xl shadow-foreground/10 md:inset-x-auto md:right-[6%] md:top-1/2 md:h-[64%] md:w-[38%] md:-translate-y-1/2 lg:h-[68%] lg:rounded-[2.5rem]">
              <Image
                src={slide.imageSrc}
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 38vw, (min-width: 768px) 42vw, 100vw"
                className="object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-white/10" />
              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/30 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground shadow-lg backdrop-blur-md">
                <Sparkles
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                {slide.stat}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-24 top-[350px] flex items-start md:inset-0 md:items-center md:pb-0 md:pt-20">
              <div className="mx-auto w-full max-w-7xl px-4 md:px-10 lg:px-16">
                <div className="max-w-xl">
                  <span
                    className={cn(
                      "hero-reveal mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md md:mb-5",
                      index === 0
                        ? "border border-primary/30 bg-primary/10"
                        : "border border-secondary-foreground/20 bg-secondary/30",
                    )}
                  >
                    {slide.tag}
                  </span>
                  <h2 className="hero-reveal mb-4 font-display text-[clamp(3.1rem,10vw,5.5rem)] font-bold leading-[0.92] text-foreground md:mb-5 md:text-[clamp(3.5rem,6vw,5.5rem)]">
                    {slide.heading.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </h2>
                  <p className="hero-reveal mb-6 max-w-md text-sm leading-relaxed text-muted-foreground md:mb-9 md:text-base">
                    {slide.body}
                  </p>
                  <Link
                    href={slide.href}
                    className={cn(
                      "hero-reveal inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:px-8 md:py-4 bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 hover:shadow-foreground/10",
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

        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-4 top-[45%] z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-card/75 text-foreground shadow-md backdrop-blur-md transition-all hover:-translate-x-0.5 hover:bg-card hover:shadow-lg md:flex lg:left-6"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-4 top-[45%] z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-card/75 text-foreground shadow-md backdrop-blur-md transition-all hover:translate-x-0.5 hover:bg-card hover:shadow-lg md:flex lg:right-6"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>

        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/35 bg-background/65 px-3 py-2 shadow-lg shadow-foreground/5 backdrop-blur-md"
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
                "relative h-2.5 cursor-pointer overflow-hidden rounded-full transition-all duration-300",
                index === current
                  ? "w-10 bg-foreground/15"
                  : "w-2.5 bg-foreground/20 hover:bg-foreground/40",
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-primary",
                  index === current
                    ? "animate-[hero-dot-progress_4s_linear_forwards]"
                    : "w-0",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
