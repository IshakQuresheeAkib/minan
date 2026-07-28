"use client";

import Image from "next/image";
import Link from "next/link";

import { NavPill } from "@/components/shared/NavPill";
import { publicRoutes } from "@/constants/routes";
import { SearchBar } from "@/features/home/components/SearchBar";

export function Navbar() {
  return (
    <header className="relative z-50 flex w-full items-center justify-between border-b border-primary/20 bg-foreground px-4 py-2 text-background shadow-md shadow-foreground/15 lg:px-10">
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
            className="h-16 w-auto"
          />
        </Link>

        <div className="hidden justify-center lg:flex">
          <NavPill />
        </div>

        <div className="w-full min-w-0 justify-self-end lg:flex lg:w-[300px] lg:justify-end">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
