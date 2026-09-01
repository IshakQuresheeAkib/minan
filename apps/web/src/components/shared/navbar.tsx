"use client";

import Image from "next/image";
import Link from "next/link";

import { NavPill } from "@/components/shared/NavPill";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";

export function Navbar() {
  return (
    <header className="relative z-50 flex w-full items-center justify-between border-b border-primary/20 bg-foreground px-4 py-2 text-background shadow-md shadow-foreground/15 lg:px-10">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 lg:grid-cols-[auto_minmax(360px,1fr)_auto_300px] lg:gap-6">
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
            className="h-16 w-auto"
          />
        </Link>

        <div className="hidden justify-center lg:flex">
          <NavPill />
        </div>

        <Link href={publicRoutes.orderTracking} className="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary/45 px-3 py-2 text-xs font-bold tracking-wide text-background transition-colors hover:bg-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none">
          Orders
        </Link>

        <div className="col-span-3 w-full min-w-0 justify-self-end lg:col-span-1 lg:flex lg:w-[300px] lg:justify-end">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
