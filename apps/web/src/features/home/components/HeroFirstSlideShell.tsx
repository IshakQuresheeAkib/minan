import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";

import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/Button";
import { heroSlides } from "@/features/home/data/hero-slides";
import { cn } from "@/lib/utils";

export function HeroFirstSlideShell() {
  const slide = heroSlides[0];

  return (
    <section
      aria-busy="true"
      aria-label="Loading homepage promotions"
      className="relative overflow-hidden"
    >
      <Navbar />

      <div className="relative h-[min(600px,calc(100svh-5rem))] min-h-[540px] w-full overflow-hidden sm:min-h-[600px] lg:h-[90svh] lg:min-h-[640px]">
        <div className={cn("absolute inset-0 bg-linear-to-br", slide.accent)} />
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
            priority
            sizes="(min-width: 1024px) 38vw, (min-width: 768px) 42vw, 100vw"
            className="object-cover object-[center_10%]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/35 via-transparent to-background/10" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-background/30 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground shadow-lg backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            {slide.stat}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 top-[312px] flex items-start sm:top-[368px] md:inset-0 md:items-center md:pb-0 md:pt-20">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-10 lg:px-16">
            <div className="max-w-xl">
              <span className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md md:mb-5">
                {slide.tag}
              </span>
              <h2 className="mb-3 font-display text-[clamp(2.55rem,12vw,4.5rem)] font-bold leading-[0.92] text-foreground md:mb-5 md:text-[clamp(3.5rem,6vw,5.5rem)]">
                {slide.heading.map((line) => (
                  <span key={line}>{line} </span>
                ))}
              </h2>
              <p className="mb-5 max-w-md text-sm leading-relaxed text-foreground/70 md:mb-9 md:text-base">
                {slide.body}
              </p>
              <Button
                href={slide.href}
                text={slide.cta}
                rightIcon={
                  <ChevronRight className="size-4" aria-hidden="true" />
                }
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute top-[258px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-background/35 bg-background/75 px-2 py-1.5 shadow-lg shadow-foreground/5 backdrop-blur-md sm:top-[318px] md:top-auto md:bottom-28 lg:bottom-8"
        >
          {heroSlides.map((item, index) => (
            <span
              key={item.id}
              className="grid size-9 place-items-center rounded-full"
            >
              <span
                className={cn(
                  "block h-2.5 rounded-full",
                  index === 0 ? "w-8 bg-primary" : "w-2.5 bg-foreground/20",
                )}
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
