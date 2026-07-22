"use client";

import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
} from "react";

import { Navbar } from "@/components/shared/navbar";
import { ResponsiveBannerImage } from "@/features/home/components/ResponsiveBannerImage";
import type { HomeBanner } from "@/features/home/schemas/home-banner.schema";
import { publicRoutes } from "@/constants/routes";
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

type HeroCarouselProps = {
  banners: HomeBanner[];
};

export function HeroCarousel({ banners }: HeroCarouselProps) {
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
  const suppressClickRef = useRef(false);
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

      gsap.set(inEl, { x: xIn, opacity: 0, zIndex: 10 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(outEl, { zIndex: 0 });
          isAnimatingRef.current = false;
        },
      });

      tl.to(
        outEl,
        {
          x: xOut,
          opacity: 0,
          duration,
          ease: "power2.inOut",
        },
        0,
      ).to(
        inEl,
        {
          x: 0,
          opacity: 1,
          duration,
          ease: "power2.inOut",
        },
        0,
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

    if (prefersReducedMotion || banners.length < 2) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % banners.length;
      goTo(next, "next");
    }, SLIDE_INTERVAL);
  }, [banners.length, clearAutoRotate, goTo, prefersReducedMotion]);

  useEffect(() => {
    resetInterval();

    return clearAutoRotate;
  }, [clearAutoRotate, resetInterval]);

  const handlePrev = useCallback(() => {
    const prev =
      (currentRef.current - 1 + banners.length) % banners.length;
    goTo(prev, "prev");
    resetInterval();
  }, [banners.length, goTo, resetInterval]);

  const handleNext = useCallback(() => {
    const next = (currentRef.current + 1) % banners.length;
    goTo(next, "next");
    resetInterval();
  }, [banners.length, goTo, resetInterval]);

  const handleDot = (index: number) => {
    const direction: Direction = index > currentRef.current ? "next" : "prev";
    goTo(index, direction);
    resetInterval();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (banners.length < 2) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      currentX: event.clientX,
      isDragging: true,
    };
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

      if (Math.abs(distance) < DRAG_THRESHOLD) return;

      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      if (distance < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    },
    [handleNext, handlePrev],
  );

  const handleSlideClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    suppressClickRef.current = false;
  };

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
        {banners.map((slide, index) => {
          const isActive = index === current;

          return (
            <div
              key={slide._id}
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
              <Link
                href={publicRoutes.products}
                aria-label="Shop products from this promotion"
                tabIndex={isActive ? undefined : -1}
                onClick={handleSlideClick}
                draggable={false}
                className="absolute inset-0 block cursor-grab focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset focus-visible:outline-none active:cursor-grabbing"
              >
                <ResponsiveBannerImage
                  desktopSrc={slide.desktop_image_url}
                  mobileSrc={slide.mobile_image_url}
                  eager={index === 0}
                />
              </Link>
            </div>
          );
        })}

        {banners.length > 1 ? <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-background/35 bg-background/75 text-foreground shadow-md backdrop-blur-md transition-all hover:-translate-x-0.5 hover:bg-background hover:shadow-lg md:flex lg:left-6"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button> : null}

        {banners.length > 1 ? <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-background/35 bg-background/75 text-foreground shadow-md backdrop-blur-md transition-all hover:translate-x-0.5 hover:bg-background hover:shadow-lg md:flex lg:right-6"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button> : null}

        {banners.length > 1 ? <div
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-background/35 bg-background/75 px-2 py-1.5 shadow-lg shadow-foreground/5 backdrop-blur-md sm:bottom-6 lg:bottom-8"
          role="group"
          aria-label="Slide controls"
        >
          {banners.map((slide, index) => (
            <button
              key={slide._id}
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
        </div> : null}
      </div>
    </section>
  );
}
