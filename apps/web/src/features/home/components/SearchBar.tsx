"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="mb-6 lg:hidden">
      <div className="flex items-center rounded-full border border-border bg-muted px-4 py-3 transition-colors focus-within:border-primary">
        <Search
          className="mr-3 size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search products"
          className="w-full border-none bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
        />
        <button
          type="button"
          aria-label="Filter products"
          className="ml-2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
