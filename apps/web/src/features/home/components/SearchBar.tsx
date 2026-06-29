"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchBar.module.css";
// import { getActiveProducts } from "@/features/products/services/product.service";
// import type { Product } from "@/features/products/types";

interface SearchBarProps {
  label?: string;
}

export function SearchBar({ label = "looking for something?" }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  // const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const results = query.trim()
    // ? products.filter((product) =>
    //     product.name.toLowerCase().includes(query.trim().toLowerCase()),
    //   )
    // : [];

  function resetToIdle(): void {
    setSpinning(false);
    setOpened(false);
    setShrink(false);
    setResultsOpen(false);
    setQuery("");
  }

  async function ensureProductsLoaded(): Promise<void> {
    if (hasFetched || loading) return;
    setLoading(true);
    setError(null);
    try {
      // const data = await getActiveProducts();
      // setProducts(data);
      setHasFetched(true);
    } catch {
      setError("Couldn't load products. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePillClick(): void {
    if (opened) return;
    setOpened(true);
    void ensureProductsLoaded();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSubmit(): void {
    if (!query.trim()) return;
    setOpened(false);
    setShrink(true);
    setSpinning(true);
    setResultsOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleResultClick(slug: string): void {
    resetToIdle();
    router.push(`/products/${slug}`);
  }

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") resetToIdle();
    }
    window.addEventListener("keyup", handleEscape);
    return () => window.removeEventListener("keyup", handleEscape);
  }, []);

  return (
    <>
      <div className={`${styles.wrapper} ${shrink ? styles.shrink : ""}`}>
        <h3 className={styles.label}>{label}</h3>
        <div
          className={`${styles.searchPill} ${opened ? styles.opened : ""} ${spinning ? styles.spin : ""}`}
          onClick={handlePillClick}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <input
              ref={inputRef}
              type="search"
              size={40}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products"
              aria-label="Search products"
              className={styles.searchInput}
            />
            <input type="submit" value="Search" className={styles.submitButton} />
          </form>
        </div>
      </div>

      <div className={`${styles.overlay} ${resultsOpen ? styles.dark : ""}`}>
        <div className={styles.panel}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={resetToIdle}
            aria-label="Close search results"
          >
            Close
          </button>
          <h1 className={styles.panelTitle}>Results for &ldquo;{query}&rdquo;</h1>

          {loading && <p className={styles.emptyState}>Loading products...</p>}
          {error && <p className={styles.emptyState}>{error}</p>}
          {!loading && !error && hasFetched && results.length === 0 && (
            <p className={styles.emptyState}>No products matched your search.</p>
          )}
          {/* {!loading &&
            !error &&
            results.map((product) => (
              <a
                key={product._id}
                className={styles.resultRow}
                onClick={(event) => {
                  event.preventDefault();
                  handleResultClick(product.slug);
                }}
                href={`/products/${product.slug}`}
              >
                <span className={styles.resultName}>{product.name}</span>
                <span className={styles.resultPrice}>৳{product.price}</span>
              </a>
            ))} */}
        </div>
      </div>
    </>
  );
}