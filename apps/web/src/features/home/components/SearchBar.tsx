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

import { Button } from "@/components/ui/Button";
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
  const queryRef = useRef("");
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
  const showSuggestions = expanded && open && trimmedQuery.length > 0;

  const reset = useCallback((): void => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    requestIdRef.current += 1;
    queryRef.current = "";
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
        if (!queryRef.current.trim()) {
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
  }, [reset]);

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
      className={cn(
        "relative flex w-full max-w-[300px] justify-end",
        showSuggestions && "z-[80]",
        className,
      )}
    >
      <form
        role="search"
        aria-label="Product search"
        onSubmit={handleSubmit}
        className={cn(
          "relative z-10 h-12 w-12 transition-[width] duration-500 ease-[cubic-bezier(0,0.11,0.35,1.2)]",
          expanded && "w-full",
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 right-4 z-2 size-5 -translate-y-1/2 transition-colors duration-200",
            expanded ? "text-primary" : "text-primary",
          )}
          aria-hidden="true"
        />
        <Button
          type="submit"
          aria-label={
            trimmedQuery ? "Submit product search" : "Open product search"
          }
          variant="secondary"
          size="icon"
          className="absolute top-0 right-0 z-3 size-12 border-0 bg-transparent p-0 text-primary shadow-none hover:bg-transparent hover:text-primary hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring/60"
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
            "h-12 w-12 rounded-full border-0 bg-foreground pr-12 pl-0 text-base text-transparent shadow-inner outline-none transition-all duration-1000 ease-in-out placeholder:text-transparent focus-visible:ring-2 focus-visible:ring-ring/50",
            expanded &&
              "w-full rounded-full pl-2.5 text-primary/80 placeholder:text-primary/80 focus-visible:ring-0",
          )}
          onChange={(event) => {
            const nextQuery = event.target.value;
            const nextTrimmedQuery = nextQuery.trim();

            setQuery(nextQuery);
            queryRef.current = nextQuery;
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
            setLoading(true);
            setError(null);
            setHasSearched(false);
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

      {showSuggestions && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full right-0 z-90 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-primary/80 shadow-inner bg-popover/95 p-1.5 text-popover-foreground shadow-foreground/10 backdrop-blur"
        >
          {loading && (
            <p className="rounded-md px-3 py-3 text-sm text-muted-foreground">
              Searching...
            </p>
          )}

          {error && (
            <p className="rounded-md px-3 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <p className="rounded-md px-3 py-3 text-sm text-muted-foreground">
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
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {product.category?.name ?? "Product"}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-foreground">
                  BDT {product.price}
                </span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
