"use client";

import gsap from "gsap";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";

import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/Button";
import { heroSlides } from "@/features/home/data/hero-slides";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL = 4000;
const ANIM_DURATION = 0.65;
const DRAG_THRESHOLD = 56;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type Direction = "next" | "prev";

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
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

      const duration = prefersReducedMotion ? 0 : ANIM_DURATION;
      const xOut = prefersReducedMotion ? 0 : direction === "next" ? -70 : 70;
      const xIn = prefersReducedMotion ? 0 : direction === "next" ? 70 : -70;
      const outgoingItems = outEl.querySelectorAll(".hero-reveal");
      const incomingItems = inEl.querySelectorAll(".hero-reveal");

      gsap.set(inEl, { x: xIn, opacity: 0, zIndex: 10 });
      gsap.set(incomingItems, { y: 26, opacity: 0 });

      gsap.to(outEl, {
        x: xOut,
        opacity: 0,
        duration,
        ease: "power2.inOut",
        onComplete: () => gsap.set(outEl, { zIndex: 0 }),
      });

      gsap.to(outgoingItems, {
        y: direction === "next" ? -16 : 16,
        opacity: 0,
        duration: duration * 0.45,
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
          duration,
          ease: "power2.inOut",
        },
        0,
      ).to(
        incomingItems,
        {
          y: 0,
          opacity: 1,
          duration: duration * 0.75,
          ease: "power3.out",
          stagger: prefersReducedMotion ? 0 : 0.08,
        },
        prefersReducedMotion ? 0 : 0.18,
      );

      currentRef.current = nextIndex;
      setCurrent(nextIndex);
    },
    [prefersReducedMotion],
  );

  const clearAutoRotate = useCallback(() => {
    if (!intervalRef.current) return;

    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const resetInterval = useCallback(() => {
    clearAutoRotate();

    if (prefersReducedMotion) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % heroSlides.length;
      goTo(next, "next");
    }, SLIDE_INTERVAL);
  }, [clearAutoRotate, goTo, prefersReducedMotion]);

  useEffect(() => {
    resetInterval();

    return clearAutoRotate;
  }, [clearAutoRotate, resetInterval]);

  const handlePrev = useCallback(() => {
    const prev =
      (currentRef.current - 1 + heroSlides.length) % heroSlides.length;
    goTo(prev, "prev");
    resetInterval();
  }, [goTo, resetInterval]);

  const handleNext = useCallback(() => {
    const next = (currentRef.current + 1) % heroSlides.length;
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
      <Navbar />

      <div
        className="relative h-[min(600px,calc(100svh-5rem))] min-h-[540px] w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing sm:min-h-[600px] lg:h-[90svh] lg:min-h-[640px]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {heroSlides.map((slide, index) => {
          const isActive = index === current;

          return (
            <div
              key={slide.id}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              className={cn(
                "absolute inset-0",
                isActive
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0",
              )}
              aria-hidden={!isActive}
              inert={!isActive ? true : undefined}
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

              <div className="absolute inset-x-4 top-4 h-[228px] overflow-hidden rounded-[1.5rem] border border-background/25 bg-background shadow-2xl shadow-foreground/10 sm:top-6 sm:h-[280px] sm:rounded-[2rem] md:inset-x-auto md:right-[6%] md:top-1/2 md:h-[64%] md:w-[38%] md:-translate-y-1/2 lg:h-[68%] lg:rounded-[2.5rem]">
                <Image
                  src={slide.imageSrc}
                  alt={slide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 38vw, (min-width: 768px) 42vw, 100vw"
                  className="object-cover object-[center_10%]"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-linear-to-t from-foreground/35 via-transparent to-background/10" />
                <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-background/30 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground shadow-lg backdrop-blur-md">
                  <Sparkles
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  {slide.stat}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-5 top-[312px] flex items-start sm:top-[368px] md:inset-0 md:items-center md:pb-0 md:pt-20">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-10 lg:px-16">
                  <div className="max-w-xl">
                    <span
                      className={cn(
                        "hero-reveal mb-3 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md md:mb-5",
                        index === 0
                          ? "border border-primary/30 bg-primary/10"
                          : "border border-foreground/20 bg-secondary/30",
                      )}
                    >
                      {slide.tag}
                    </span>
                    <h2 className="hero-reveal mb-3 font-display text-[clamp(2.55rem,12vw,4.5rem)] font-bold leading-[0.92] text-foreground md:mb-5 md:text-[clamp(3.5rem,6vw,5.5rem)]">
                      {slide.heading.map((line) => (
                        <span key={line} className="">
                          {line}{" "}
                        </span>
                      ))}
                    </h2>
                    <p className="hero-reveal mb-5 max-w-md text-sm leading-relaxed text-foreground/70 md:mb-9 md:text-base">
                      {slide.body}
                    </p>
                    <Button
                      href={slide.href}
                      text={slide.cta}
                      tabIndex={isActive ? undefined : -1}
                      rightIcon={
                        <ChevronRight className="size-4" aria-hidden="true" />
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-4 top-[45%] z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-background/35 bg-background/75 text-foreground shadow-md backdrop-blur-md transition-all hover:-translate-x-0.5 hover:bg-background hover:shadow-lg md:flex lg:left-6"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-4 top-[45%] z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-background/35 bg-background/75 text-foreground shadow-md backdrop-blur-md transition-all hover:translate-x-0.5 hover:bg-background hover:shadow-lg md:flex lg:right-6"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>

        <div
          className="absolute top-[258px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-background/35 bg-background/75 px-2 py-1.5 shadow-lg shadow-foreground/5 backdrop-blur-md sm:top-[318px] md:top-auto md:bottom-28 lg:bottom-8"
          role="group"
          aria-label="Slide controls"
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleDot(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              className="grid size-9 cursor-pointer place-items-center rounded-full transition-colors duration-200 hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "relative block h-2.5 overflow-hidden rounded-full transition-all duration-300",
                  index === current
                    ? "w-8 bg-foreground/15"
                    : "w-2.5 bg-foreground/20",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-primary",
                    index === current
                      ? prefersReducedMotion
                        ? "w-full"
                        : "animate-[hero-dot-progress_4s_linear_forwards]"
                      : "w-0",
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
