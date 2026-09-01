"use client";

import Image from "next/image";
import Link from "next/link";

import { NavPill } from "@/components/shared/NavPill";
import { NavbarActions } from "@/components/shared/NavbarActions";
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

        <NavbarActions />
      </div>
    </header>
  );
}
