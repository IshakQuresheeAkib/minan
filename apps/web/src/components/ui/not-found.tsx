"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";

export function NotFound() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (!page || reducedMotion.matches) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return;
      }

      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        timeline
          .from("[data-not-found-brand]", {
            y: -8,
            duration: 0.45,
          })
          .from(
            "[data-not-found-code] > *",
            {
              y: 24,
              duration: 0.65,
              stagger: 0.09,
            },
            "-=0.2",
          )
          .from(
            "[data-not-found-copy] > *",
            {
              y: 18,
              duration: 0.55,
              stagger: 0.08,
            },
            "-=0.35",
          );

        gsap.to("[data-not-found-ghost]", {
          y: -9,
          rotate: 1.5,
          duration: 2.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, page);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main
      ref={pageRef}
      className="relative flex min-h-dvh overflow-x-clip bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8"
    >
      <Link
        href={publicRoutes.home}
        data-not-found-brand
        aria-label="MINAN — go to homepage"
        className="absolute top-6 left-4 z-10 w-fit rounded-md outline-none transition-opacity duration-300 hover:opacity-80 focus-visible:ring-3 focus-visible:ring-primary/60 sm:top-8 sm:left-8"
      >
        <Image
          src="/logo.png"
          alt="MINAN"
          width={364}
          height={353}
          className="h-12 w-auto sm:h-14"
          priority
        />
      </Link>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center pt-14 pb-8 text-center">
        <div
          data-not-found-code
          role="img"
          aria-label="Error 404"
          className="mb-7 flex items-center justify-center gap-1 sm:mb-9 sm:gap-3"
        >
          <span
            className="select-none font-display text-[clamp(4.5rem,22vw,11rem)] leading-none font-bold tracking-[-0.08em] text-foreground/75"
            aria-hidden="true"
          >
            4
          </span>
          <span
            className="group relative flex size-24 shrink-0 items-center justify-center sm:size-40"
            aria-hidden="true"
          >
            <span
              data-not-found-ghost
              className="block transition-transform duration-500 ease-out group-hover:scale-105"
            >
              <Image
                src="https://res.cloudinary.com/dhfg728um/image/upload/v1789118610/minan-ghost-404_haki5o.webp"
                alt=""
                width={160}
                height={160}
                sizes="(min-width: 640px) 160px, 112px"
                className="size-24 object-contain drop-shadow-[0_18px_18px_rgba(38,38,38,0.12)] select-none sm:size-40"
                draggable={false}
                priority
              />
            </span>
          </span>
          <span
            className="select-none font-display text-[clamp(4.5rem,22vw,11rem)] leading-none font-bold tracking-[-0.08em] text-foreground/75"
            aria-hidden="true"
          >
            4
          </span>
        </div>

        <div data-not-found-copy className="flex max-w-2xl flex-col items-center">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-foreground/50 uppercase">
            Lost between collections
          </p>
          <h1 className="font-display text-3xl leading-tight font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            This page slipped off the rack.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-foreground/65 sm:mt-5 sm:text-lg">
            The address may have moved, or the link may be out of season. Head
            home or keep browsing the collection.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:flex-row">
            <Button href={publicRoutes.home}>Back to MINAN</Button>
            <Button
              href={publicRoutes.products}
              variant="secondary"
              rightIcon={<ArrowUpRight className="size-4" aria-hidden="true" />}
            >
              Browse the collection
            </Button>
          </div>

          <p className="mt-10 text-xs leading-5 text-foreground/45 sm:mt-12">
            Error 404 · This address does not exist.
          </p>
        </div>
      </div>
    </main>
  );
}
