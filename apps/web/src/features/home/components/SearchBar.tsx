"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import type { Product } from "@/features/products/schemas/product.schema";
import { getProducts } from "@/features/products/services/product.service";

interface SearchBarProps {
  label?: string;
  variant?: "default" | "navbar";
}

export function SearchBar({
  label = "looking for something?",
  variant = "default",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [opened, setOpened] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const trimmedQuery = query.trim();

  const resetToIdle = useCallback((): void => {
    requestIdRef.current += 1;
    setSpinning(false);
    setOpened(false);
    setShrink(false);
    setResultsOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
    setHasSearched(false);
  }, []);

  function handleWrapperClick(): void {
    if (opened) return;
    setOpened(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSubmit(): void {
    if (!trimmedQuery) {
      inputRef.current?.focus();
      return;
    }

    setOpened(false);
    setShrink(true);
    setSpinning(true);
    setResultsOpen(true);
  }

  function handleCloseKeyDown(event: KeyboardEvent<HTMLHeadingElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetToIdle();
    }
  }

  function handlePanelClick(event: MouseEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextQuery = event.target.value;
    const nextTrimmedQuery = nextQuery.trim();

    setQuery(nextQuery);
    requestIdRef.current += 1;

    if (!nextTrimmedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    setResults([]);
    setLoading(true);
    setError(null);
    setHasSearched(false);
  }

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") resetToIdle();
    }

    window.addEventListener("keyup", handleEscape);
    return () => window.removeEventListener("keyup", handleEscape);
  }, [resetToIdle]);

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timeoutId = window.setTimeout(() => {
      void getProducts({ search: trimmedQuery, page: 1, limit: 8 })
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
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedQuery]);

  const isNavbar = variant === "navbar";

  return (
    <section
      className={`minan-search${isNavbar ? " minan-search--navbar" : ""}`}
      aria-label="Product search"
    >
      <div
        className={`exit ${resultsOpen ? "dark" : ""}`}
        onClick={resetToIdle}
        aria-hidden={!resultsOpen}
      >
        <div className="inner" onClick={handlePanelClick}>
          <h4
            role="button"
            tabIndex={resultsOpen ? 0 : -1}
            onClick={resetToIdle}
            onKeyDown={handleCloseKeyDown}
          >
            Close
          </h4>
          <h1>Results</h1>
          <p>
            {loading && <span className="search-result">Searching...</span>}
            {error && <span className="search-result">{error}</span>}
            {!loading && !error && hasSearched && results.length === 0 && (
              <span className="search-result">
                No products matched &quot;{trimmedQuery}&quot;.
              </span>
            )}
            {!loading &&
              !error &&
              results.map((product) => (
                <span className="search-result" key={product._id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={resetToIdle}
                  >
                    {product.name}
                  </Link>
                  {product.description}
                  <strong>BDT {product.price}</strong>
                </span>
              ))}
          </p>
        </div>
      </div>

      <div
        className={`wrapper ${shrink ? "shrink" : ""}`}
        onClick={handleWrapperClick}
      >
        {!isNavbar && label ? <h3>{label}</h3> : null}
        <div
          className={`search ${opened ? "opened" : ""} ${spinning ? "spin" : ""}`}
        >
          <form
            name="cse"
            id="searchbox_demo"
            className="searchform"
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              size={40}
              className="searchbox"
              value={query}
              aria-label="Search products"
              onChange={handleQueryChange}
            />
            <input type="submit" name="sa" value="Search" />
          </form>
        </div>
      </div>

      <div id="results" />
    </section>
  );
}
