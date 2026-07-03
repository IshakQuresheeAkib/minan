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
          "flex w-full items-center justify-between px-4 py-2 lg:px-10",
          overlay
            ? "relative z-50 border-b border-border/60 bg-background lg:absolute lg:inset-x-0 lg:top-0 lg:border-b-0 lg:bg-transparent"
            : "relative border-b border-border/60 bg-background",
        )}
      >
        <div className="grid w-full grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 lg:grid-cols-[auto_minmax(360px,1fr)_300px] lg:gap-8">
          <Link
            href={publicRoutes.home}
            aria-label="MINAN — go to homepage"
            className="w-fit shrink-0 transition-opacity duration-200 hover:opacity-85"
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

          <div className="hidden justify-center lg:flex">
            <NavPill variant={overlay ? "overlay" : "default"} />
          </div>

          <div className="w-full min-w-0 justify-self-end lg:flex lg:w-[300px] lg:justify-end">
            <SearchBar />
          </div>
        </div>
      </header>
    </>
  );
}
