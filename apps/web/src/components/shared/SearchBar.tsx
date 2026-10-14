"use client";

import { Search, X } from "lucide-react";
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
import { adminRoutes, publicRoutes } from "@/constants/routes";
import { ProductDetailsLink } from "@/features/products/components/ProductDetailsLink";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import type { Product } from "@/features/products/schemas/product.schema";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  className?: string;
  initialQuery?: string;
  onSearchSubmit?: (query: string) => void;
  variant?: "navbar" | "catalog" | "admin";
  alwaysOpen?: boolean;
  placeholder?: string;
  getItemHref?: (product: Product) => string;
}

export function SearchBar({
  className,
  initialQuery = "",
  onSearchSubmit,
  variant = "navbar",
  alwaysOpen,
  placeholder,
  getItemHref,
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
  const isAdmin = variant === "admin";
  const isAlwaysOpen = alwaysOpen ?? (isCatalog || isAdmin);

  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState(isAlwaysOpen);
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
    setExpanded(isAlwaysOpen);
    setResults([]);
    setOpen(false);
    setLoading(false);
    setError(null);
    setHasSearched(false);
  }, [isAlwaysOpen]);

  const runSearch = useCallback((searchQuery: string): void => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setHasSearched(false);

    void import("@/features/products/services/product.service")
      .then(({ getProducts }) =>
        getProducts({ search: searchQuery, page: 1, limit: 8 }),
      )
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
        if (!isAlwaysOpen && !queryRef.current.trim()) {
          setExpanded(false);
        }
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }

      if (isAlwaysOpen) {
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
  }, [isAlwaysOpen, reset]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setExpanded(true);

    if (!trimmedQuery) {
      if (isAlwaysOpen) {
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
      const targetRoute = isAdmin
        ? adminRoutes.products
        : publicRoutes.products;
      const params = new URLSearchParams({ search: trimmedQuery });
      router.push(`${targetRoute}?${params.toString()}`);
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

  const defaultPlaceholder = isAdmin
    ? "Search catalog products..."
    : isCatalog
      ? "Search products..."
      : "Type to search...";
  const activePlaceholder = placeholder ?? defaultPlaceholder;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex w-full",
        isAdmin
          ? "max-w-none justify-start"
          : isCatalog
            ? "max-w-none justify-end justify-self-end"
            : "max-w-62.5 justify-end justify-self-end",
        showSuggestions && "z-80",
        className,
      )}
    >
      <form
        role="search"
        aria-label={isAdmin ? "Catalog product search" : "Product search"}
        onSubmit={handleSubmit}
        className={cn(
          "relative z-10 h-9",
          isAlwaysOpen
            ? "w-full"
            : cn(
                "w-10.5 transition-[width] duration-500 ease-[cubic-bezier(0,0.11,0.35,1.2)]",
                expanded &&
                  "absolute right-0 top-1/2 -translate-y-1/2 w-40 sm:w-52 lg:w-40 xl:w-52 2xl:w-70",
              ),
        )}
      >
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 z-2 -translate-y-1/2 transition-colors duration-300",
            isAdmin
              ? "left-3.5 size-4 text-neutral-400"
              : "right-3 size-6 text-foreground",
          )}
          aria-hidden="true"
        />

        {!isAdmin && (
          <Button
            type="submit"
            aria-label={
              trimmedQuery ? "Submit product search" : "Open product search"
            }
            variant="secondary"
            size="icon"
            className="absolute top-0 right-0 z-3 size-9 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-primary/10 hover:text-foreground hover:shadow-none focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={() => {
              if (!isAlwaysOpen && !trimmedQuery) {
                expandAndFocus();
              }
            }}
            onMouseEnter={isAlwaysOpen ? undefined : expandAndFocus}
          />
        )}

        {isAdmin && trimmedQuery ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              reset();
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 z-3 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="size-3.5" />
          </button>
        ) : null}

        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder={activePlaceholder}
          aria-label={isAdmin ? "Search catalog products" : "Search products"}
          aria-controls={showSuggestions ? resultsId : undefined}
          aria-describedby={statusId}
          autoComplete="off"
          className={cn(
            "h-9 w-9 rounded-full border border-primary/45 bg-primary pr-9 pl-0 text-base text-transparent shadow-inner shadow-primary/20 outline-none transition-all duration-1000 ease-in-out placeholder:text-transparent focus-visible:ring-2 focus-visible:ring-primary/50",
            expanded &&
              "w-full rounded-full pl-3 text-foreground placeholder:text-xs sm:placeholder:text-sm placeholder:text-foreground/70 focus-visible:ring-primary/45",
            isCatalog &&
              "w-full bg-background pl-4 text-foreground placeholder:text-foreground/60 transition-colors duration-300",
            isAdmin &&
              "w-full rounded-full border-[#DFD6C8] bg-white/80 py-2 pl-10 pr-9 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 shadow-xs transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20",
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
          className={cn(
            "absolute top-full z-90 mt-5 max-h-80 w-60 2xl:w-70 overflow-y-auto rounded-lg border border-primary/80 shadow-inner bg-background/90 p-1.5 text-foreground shadow-foreground/10 backdrop-blur scrollbar-thin scrollbar-thumb-primary/60",
            isAdmin
              ? "left-0 right-0 mt-2 w-full max-w-none rounded-2xl border-[#E5DCD0] bg-white/95 p-2 text-neutral-900 shadow-xl shadow-amber-950/10 backdrop-blur-md"
              : "right-0",
          )}
        >
          {loading && (
            <p
              className={cn(
                "rounded-md px-3 py-3 text-sm",
                isAdmin ? "text-xs text-neutral-500" : "text-foreground/70",
              )}
            >
              Searching...
            </p>
          )}

          {error && (
            <p className="rounded-md px-3 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <p
              className={cn(
                "rounded-md px-3 py-3 text-sm",
                isAdmin ? "text-xs text-neutral-500" : "text-foreground/70",
              )}
            >
              No products matched &quot;{trimmedQuery}&quot;.
            </p>
          )}

          {!loading &&
            !error &&
            results.map((product) => {
              const href = getItemHref
                ? getItemHref(product)
                : isAdmin
                  ? `${adminRoutes.products}?search=${encodeURIComponent(product.name)}`
                  : `/products/${product.slug}`;

              const content = (
                <>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-xs sm:text-sm font-medium",
                        isAdmin ? "text-neutral-800" : "text-foreground",
                      )}
                    >
                      {product.name}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-xs",
                        isAdmin ? "text-neutral-400" : "text-foreground/70",
                      )}
                    >
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
                </>
              );

              if (isAdmin) {
                return (
                  <Link
                    key={product._id}
                    href={href}
                    onClick={reset}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F6F1EB] focus-visible:bg-[#F6F1EB] focus-visible:outline-none"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <ProductDetailsLink
                  key={product._id}
                  href={href}
                  onClick={reset}
                  className="flex items-center justify-between gap-3 rounded-md px-1 sm:px-3 py-2.5 transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none"
                >
                  {content}
                </ProductDetailsLink>
              );
            })}
        </div>
      )}
    </div>
  );
}
