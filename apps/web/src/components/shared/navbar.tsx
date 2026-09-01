"use client";

import Image from "next/image";
import Link from "next/link";

import { NavPill } from "@/components/shared/NavPill";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";

export function Navbar() {
  return (
    <header className="relative z-50 flex w-full items-center justify-between border-b border-primary/20 bg-foreground px-4 py-2 text-background shadow-md shadow-foreground/15 lg:px-10">
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 lg:grid-cols-[auto_minmax(360px,1fr)_300px_auto] lg:gap-6">
        <Link
          href={publicRoutes.home}
          aria-label="MINAN — go to homepage"
          className="w-fit shrink-0 rounded-md justify-self-start transition-opacity duration-200 hover:opacity-85 focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          <Image
            src="/logo.png"
            alt="MINAN"
            width={364}
            height={353}
            className="h-12 w-auto sm:h-14 lg:h-16"
          />
        </Link>

        <div className="hidden justify-center lg:flex">
          <NavPill />
        </div>

        <div className="col-start-2 row-start-1 w-full min-w-0 justify-self-end lg:col-auto lg:row-auto lg:flex lg:w-[300px] lg:justify-end">
          <SearchBar />
        </div>

        <Link
          href={publicRoutes.orderTracking}
          className="col-start-3 row-start-1 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-primary/45 px-3 text-xs font-bold tracking-wide whitespace-nowrap text-background transition-colors hover:bg-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none lg:col-auto lg:row-auto"
        >
          Track Orders
        </Link>
      </div>
    </header>
  );
}
