"use client";

import { Search } from "lucide-react";
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
import { ProductDetailsLink } from "@/features/products/components/ProductDetailsLink";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import type { Product } from "@/features/products/schemas/product.schema";
import { getProducts } from "@/features/products/services/product.service";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  initialQuery?: string;
  onSearchSubmit?: (query: string) => void;
  variant?: "navbar" | "catalog";
}

export function SearchBar({
  className,
  initialQuery = "",
  onSearchSubmit,
  variant = "navbar",
}: SearchBarProps) {
  const router = useRouter();
  const resultsId = useId();
  const statusId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(initialQuery);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const isCatalog = variant === "catalog";
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState(isCatalog);
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const trimmedQuery = query.trim();
  const showSuggestions = expanded && open && trimmedQuery.length > 0;
  const statusMessage = loading
    ? "Searching products."
    : error
      ? error
      : hasSearched
        ? results.length > 0
          ? `${results.length} product suggestion${
              results.length === 1 ? "" : "s"
            } available.`
          : `No products matched ${trimmedQuery}.`
        : "";

  const reset = useCallback((): void => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    requestIdRef.current += 1;
    queryRef.current = "";
    setQuery("");
    setExpanded(isCatalog);
    setResults([]);
    setOpen(false);
    setLoading(false);
    setError(null);
    setHasSearched(false);
  }, [isCatalog]);

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
        if (!isCatalog && !queryRef.current.trim()) {
          setExpanded(false);
        }
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }

      if (isCatalog) {
        setOpen(false);
        return;
      }

      reset();
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
  }, [isCatalog, reset]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setExpanded(true);

    if (!trimmedQuery) {
      if (isCatalog) {
        onSearchSubmit?.("");
        setOpen(false);
        return;
      }

      inputRef.current?.focus();
      return;
    }

    if (onSearchSubmit) {
      onSearchSubmit(trimmedQuery);
    } else {
      const params = new URLSearchParams({ search: trimmedQuery });
      router.push(`${publicRoutes.products}?${params.toString()}`);
    }
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
        "relative flex w-full justify-end justify-self-end",
        isCatalog ? "max-w-none" : "max-w-62.5",
        showSuggestions && "z-80",
        className,
      )}
    >
      <form
        role="search"
        aria-label="Product search"
        onSubmit={handleSubmit}
        className={cn(
          "relative z-10 h-9 w-10.5 transition-[width] duration-500 ease-[cubic-bezier(0,0.11,0.35,1.2)]",
          expanded && "absolute right-0 top-1/2 -translate-y-1/2 w-40 sm:w-52 2xl:w-70",
          isCatalog && "relative w-full",
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 z-2 size-6 -translate-y-1/2 transition-colors duration-300",
            "text-foreground",
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
          className="absolute top-0 right-0 z-3 size-9 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-primary/10 hover:text-foreground hover:shadow-none focus-visible:ring-2 focus-visible:ring-primary/60"
          onClick={() => {
            if (!isCatalog && !trimmedQuery) {
              expandAndFocus();
            }
          }}
          onMouseEnter={isCatalog ? undefined : expandAndFocus}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Type to search..."
          aria-label="Search products"
          aria-controls={showSuggestions ? resultsId : undefined}
          aria-describedby={statusId}
          autoComplete="off"
          className={cn(
            "h-9 w-9 rounded-full border border-primary/45 bg-primary pr-9 pl-0 text-base text-transparent shadow-inner shadow-primary/20 outline-none transition-all duration-1000 ease-in-out placeholder:text-transparent focus-visible:ring-2 focus-visible:ring-primary/50",
            expanded &&
              "w-full rounded-full pl-3 text-foreground placeholder:text-xs sm:placeholder:text-sm placeholder:text-foreground/70 focus-visible:ring-primary/45",
            isCatalog &&
              "w-full bg-background pl-4 text-foreground placeholder:text-foreground/60 transition-colors duration-300",
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
        <span
          id={statusId}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </span>
      </form>

      {showSuggestions && (
        <div
          id={resultsId}
          aria-label="Search suggestions"
          className="absolute top-full right-0 z-90 mt-5 max-h-80 w-60 2xl:w-70 overflow-y-auto rounded-lg border border-primary/80 shadow-inner bg-background/90 p-1.5 text-foreground shadow-foreground/10 backdrop-blur scrollbar-thin scrollbar-thumb-primary/60"
          >
          {loading && (
            <p className="rounded-md px-3 py-3 text-sm text-foreground/70">
              Searching...
            </p>
          )}

          {error && (
            <p className="rounded-md px-3 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <p className="rounded-md px-3 py-3 text-sm text-foreground/70">
              No products matched &quot;{trimmedQuery}&quot;.
            </p>
          )}

          {!loading &&
            !error &&
            results.map((product) => (
              <ProductDetailsLink
                key={product._id}
                href={`/products/${product.slug}`}
                onClick={reset}
                className="flex items-center justify-between gap-3 rounded-md px-1 sm:px-3 py-2.5 transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs sm:text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-foreground/70">
                    {product.category?.name ?? "Product"}
                  </span>
                </span>
                <ProductPrice
                  className="shrink-0 justify-end"
                  price={product.discounted_price}
                  originalPrice={product.price}
                  discount={product.discount}
                  showOriginalPrice={false}
                  size="sm"
                />
              </ProductDetailsLink>
            ))}
        </div>
      )}
    </div>
  );
}
