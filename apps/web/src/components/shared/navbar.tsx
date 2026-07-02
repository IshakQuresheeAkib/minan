"use client";

import Image from "next/image";
import Link from "next/link";

import { NavPill } from "@/components/shared/NavPill";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";
import { cn } from "@/lib/utils";

type NavbarProps = {
  overlay?: boolean;
};

export function Navbar({ overlay = false }: NavbarProps) {
  return (
    <>
      {overlay ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden h-[150px] bg-linear-to-b from-black/50 via-black/30 to-transparent lg:block"
        />
      ) : null}
      <header
        className={cn(
          "flex w-full items-center justify-between px-4 py-1 lg:px-10",
          overlay
            ? "relative z-50 border-b border-border/60 bg-background lg:absolute lg:inset-x-0 lg:top-0 lg:border-b-0 lg:bg-transparent"
            : "relative border-b border-border/60 bg-background",
        )}
      >
        <div className="flex w-full items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(360px,1fr)_auto] lg:gap-8">
          <Link
            href={publicRoutes.home}
            aria-label="MINAN — go to homepage"
            className="shrink-0 transition-opacity duration-200 hover:opacity-85"
          >
            <Image
              src="/logo.png"
              alt="MINAN"
              width={364}
              height={353}
              priority
              className="h-16 w-auto"
            />
          </Link>

          <div className="flex justify-center">
            <NavPill variant={overlay ? "overlay" : "default"} />
          </div>

          <div className="min-w-0 shrink-0 lg:flex lg:justify-end">
            <SearchBar />
          </div>
        </div>
      </header>
    </>
  );
}
