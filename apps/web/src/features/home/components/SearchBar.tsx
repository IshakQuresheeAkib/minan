"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { publicRoutes } from "@/constants/routes";
import type { Product } from "@/features/products/schemas/product.schema";
import { getProducts } from "@/features/products/services/product.service";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const resultsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
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
    setExpanded(false);
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
        if (!query.trim()) {
          setExpanded(false);
        }
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
  }, [query, reset]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setExpanded(true);

    if (!trimmedQuery) {
      inputRef.current?.focus();
      return;
    }

    const params = new URLSearchParams({ search: trimmedQuery });
    router.push(`${publicRoutes.products}?${params.toString()}`);
    setOpen(false);
  }

  function expandAndFocus(): void {
    setExpanded(true);
    inputRef.current?.focus();
    if (trimmedQuery) {
      setOpen(true);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative flex w-full justify-end", className)}
    >
      <form
        role="search"
        aria-label="Product search"
        onSubmit={handleSubmit}
        className={cn(
          "relative h-12 w-full lg:w-12 lg:transition-[width] lg:duration-500 lg:ease-[cubic-bezier(0,0.11,0.35,2)]",
          expanded && "lg:w-[300px]",
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 right-4 z-2 size-5 -translate-y-1/2 transition-colors duration-200",
            expanded
              ? "text-primary-foreground lg:text-foreground"
              : "text-primary-foreground",
          )}
          aria-hidden="true"
        />
        <button
          type="submit"
          aria-label={
            trimmedQuery ? "Submit product search" : "Open product search"
          }
          className="absolute top-0 right-0 z-3 flex size-12 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          onClick={() => {
            if (!trimmedQuery) {
              expandAndFocus();
            }
          }}
          onMouseEnter={expandAndFocus}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={query}
          placeholder="Type to search..."
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={open && trimmedQuery.length > 0}
          aria-haspopup="listbox"
          aria-controls={resultsId}
          autoComplete="off"
          className={cn(
            "h-12 w-full rounded-full border-0 bg-primary pr-12 pl-4 text-base text-primary-foreground shadow-sm outline-none transition-all duration-500 ease-in-out placeholder:text-primary-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50",
            "lg:w-12 lg:pl-0 lg:text-transparent lg:placeholder:text-transparent",
            expanded &&
              "lg:w-[300px] lg:rounded-none lg:border-b lg:border-foreground/40 lg:bg-transparent lg:pl-4 lg:text-foreground lg:shadow-none lg:placeholder:text-muted-foreground lg:focus-visible:ring-0",
          )}
          onChange={(event) => {
            const nextQuery = event.target.value;
            const nextTrimmedQuery = nextQuery.trim();

            setQuery(nextQuery);
            setExpanded(true);

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
            setExpanded(true);
            if (trimmedQuery) setOpen(true);
          }}
        />
      </form>

      {open && trimmedQuery && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md lg:left-auto lg:w-[300px]"
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
