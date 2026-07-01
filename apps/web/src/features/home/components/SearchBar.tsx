"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Input } from "@/components/ui/input";
import type { Product } from "@/features/products/schemas/product.schema";
import { getProducts } from "@/features/products/services/product.service";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const trimmedQuery = query.trim();

  const reset = useCallback((): void => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setOpen(false);
    setLoading(false);
    setError(null);
    setHasSearched(false);
  }, []);

  const runSearch = useCallback((searchQuery: string): void => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setHasSearched(false);

    void getProducts({ search: searchQuery, page: 1, limit: 8 })
      .then((response) => {
        if (requestIdRef.current !== requestId) return;
        setResults(response.data);
        setHasSearched(true);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setError("Couldn't load products. Try again.");
        setResults([]);
        setHasSearched(true);
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") reset();
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [reset]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!trimmedQuery) return;
    setOpen(true);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[200px] ml-auto", className)}
    >
      <form
        role="search"
        aria-label="Product search"
        onSubmit={handleSubmit}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          placeholder="Search products"
          aria-label="Search products"
          aria-expanded={open && trimmedQuery.length > 0}
          aria-controls="search-results"
          autoComplete="off"
          className="h-10 bg-background/80 pl-9"
          onChange={(event) => {
            const nextQuery = event.target.value;
            const nextTrimmedQuery = nextQuery.trim();

            setQuery(nextQuery);

            if (!nextTrimmedQuery) {
              if (debounceRef.current !== null) {
                window.clearTimeout(debounceRef.current);
                debounceRef.current = null;
              }
              requestIdRef.current += 1;
              setResults([]);
              setLoading(false);
              setError(null);
              setHasSearched(false);
              setOpen(false);
              return;
            }

            setOpen(true);
            if (debounceRef.current !== null) {
              window.clearTimeout(debounceRef.current);
            }
            debounceRef.current = window.setTimeout(() => {
              runSearch(nextTrimmedQuery);
            }, 250);
          }}
          onFocus={() => {
            if (trimmedQuery) setOpen(true);
          }}
        />
      </form>

      {open && trimmedQuery && (
        <div
          id="search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md"
        >
          {loading && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Searching...
            </p>
          )}

          {error && (
            <p className="px-2 py-3 text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No products matched &quot;{trimmedQuery}&quot;.
            </p>
          )}

          {!loading &&
            !error &&
            results.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug}`}
                role="option"
                onClick={reset}
                className="block rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                <span className="block text-sm font-medium text-foreground">
                  {product.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  BDT {product.price}
                </span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
