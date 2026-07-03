"use client";

import {
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import type { Product } from "@/features/products/schemas/product.schema";
import {
  mapProductToCard,
  type ProductFilterOptions,
  type ProductSortOption,
} from "@/features/products/services/product.service";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { ApiList } from "@/types/api.types";
import { cn } from "@/lib/utils";

const sortLabels: Record<ProductSortOption, string> = {
  newest: "Newest",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
  "name-asc": "Name A-Z",
};

const colorSwatches: Record<string, string> = {
  Beige: "#d8c2a7",
  Black: "#111111",
  Blue: "#3468b7",
  Brown: "#7a4b2a",
  Gold: "#c99b2e",
  Red: "#7f1d1d",
  Navy: "#172554",
  Orange: "#c2410c",
  Pink: "#e879f9",
  Purple: "#9333ea",
  Yellow: "#eab308",
  Green: "#16a34a",
  Teal: "#14b8a6",
  Cyan: "#0891b2",
  White: "#ffffff",
  "Sky Blue": "#7dd3fc",
};

export type ProductCatalogFilters = {
  categories: string[];
  colors: string[];
  sizes: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSortOption;
};

type ProductCatalogProps = {
  filters: ProductCatalogFilters;
  filterOptions: ProductFilterOptions;
  initialData: ApiList<Product>;
};

type MultiFilterKey = "category" | "color" | "size";

function formatPrice(value: number) {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

function isChecked(values: readonly string[], value: string) {
  return values.includes(value);
}

export function ProductCatalog({
  filters,
  filterOptions,
  initialData,
}: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    products,
    isLoading,
    isRefreshing,
    error,
    loadMore,
    hasMore,
    total,
  } = useProducts({
    category: filters.categories,
    colors: filters.colors,
    sizes: filters.sizes,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    search: filters.search,
    sort: filters.sort,
    initialData,
  });

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "360px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const categoryLabelBySlug = useMemo(
    () =>
      new Map(
        filterOptions.categories.map((category) => [
          category.slug,
          category.name,
        ]),
      ),
    [filterOptions.categories],
  );

  function buildUrl(nextFilters: ProductCatalogFilters) {
    const params = new URLSearchParams();

    nextFilters.categories.forEach((category) => {
      params.append("category", category);
    });
    nextFilters.colors.forEach((color) => {
      params.append("color", color);
    });
    nextFilters.sizes.forEach((size) => {
      params.append("size", size);
    });

    if (nextFilters.search) {
      params.set("search", nextFilters.search);
    }

    if (nextFilters.minPrice !== undefined) {
      params.set("minPrice", String(nextFilters.minPrice));
    }

    if (nextFilters.maxPrice !== undefined) {
      params.set("maxPrice", String(nextFilters.maxPrice));
    }

    if (nextFilters.sort !== "newest") {
      params.set("sort", nextFilters.sort);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function pushFilters(nextFilters: ProductCatalogFilters) {
    startTransition(() => {
      router.push(buildUrl(nextFilters), { scroll: false });
    });
  }

  function toggleMultiFilter(
    key: MultiFilterKey,
    value: string,
    checked: boolean,
  ) {
    const map = {
      category: filters.categories,
      color: filters.colors,
      size: filters.sizes,
    };
    const current = map[key];
    const nextValues = checked
      ? [...new Set([...current, value])]
      : current.filter((item) => item !== value);

    pushFilters({
      ...filters,
      categories: key === "category" ? nextValues : filters.categories,
      colors: key === "color" ? nextValues : filters.colors,
      sizes: key === "size" ? nextValues : filters.sizes,
    });
  }

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const minPriceRaw = String(formData.get("minPrice") ?? "").trim();
    const maxPriceRaw = String(formData.get("maxPrice") ?? "").trim();

    const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

    pushFilters({
      ...filters,
      minPrice:
        minPrice !== undefined && Number.isFinite(minPrice)
          ? Math.max(0, minPrice)
          : undefined,
      maxPrice:
        maxPrice !== undefined && Number.isFinite(maxPrice)
          ? Math.max(0, maxPrice)
          : undefined,
    });
  }

  function clearPrice() {
    pushFilters({
      ...filters,
      minPrice: undefined,
      maxPrice: undefined,
    });
  }

  function resetFilters() {
    pushFilters({
      categories: [],
      colors: [],
      sizes: [],
      search: filters.search,
      sort: "newest",
    });
  }

  const activeFilterCount =
    filters.categories.length +
    filters.colors.length +
    filters.sizes.length +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.sort !== "newest" ? 1 : 0);
  const cards = products.map(mapProductToCard);
  const isPaginating = isLoading && !isRefreshing && products.length > 0;

  function renderFilterPanel() {
    return (
      <FilterPanel
        categories={filterOptions.categories}
        colors={filterOptions.colors}
        sizes={filterOptions.sizes}
        filters={filters}
        priceRange={filterOptions.price}
        onApplyPrice={applyPrice}
        onClearPrice={clearPrice}
        onReset={resetFilters}
        onToggle={toggleMultiFilter}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-[0_16px_48px_rgba(151,72,34,0.08)] backdrop-blur">
          {renderFilterPanel()}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-[0_12px_36px_rgba(151,72,34,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {total.toLocaleString("en-BD")} result{total === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeFilterCount > 0
                ? `${activeFilterCount} active refinement${
                    activeFilterCount === 1 ? "" : "s"
                  }`
                : "Showing the latest collection"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="lg:hidden"
                  leftIcon={<SlidersHorizontal className="size-4" />}
                  text="Filters"
                />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[88vw] max-w-sm overflow-y-auto p-0"
              >
                <SheetHeader className="border-b border-border/70 px-5 py-4">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine the collection by fit, shade, and price.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-5 py-4">{renderFilterPanel()}</div>
                <SheetFooter className="border-t border-border/70">
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={<RotateCcw className="size-4" />}
                    onClick={resetFilters}
                    text="Reset filters"
                  />
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Select
              value={filters.sort}
              onValueChange={(value) => {
                pushFilters({
                  ...filters,
                  sort: value as ProductSortOption,
                });
              }}
            >
              <SelectTrigger className="h-10 min-w-44 rounded-full border-primary/60 bg-background px-4 shadow-none">
                <SelectValue aria-label={sortLabels[filters.sort]} />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.entries(sortLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <FilterChip
                key={category}
                label={categoryLabelBySlug.get(category) ?? category}
                onRemove={() => toggleMultiFilter("category", category, false)}
              />
            ))}
            {filters.colors.map((color) => (
              <FilterChip
                key={color}
                label={color}
                swatch={colorSwatches[color]}
                onRemove={() => toggleMultiFilter("color", color, false)}
              />
            ))}
            {filters.sizes.map((size) => (
              <FilterChip
                key={size}
                label={size}
                onRemove={() => toggleMultiFilter("size", size, false)}
              />
            ))}
            {(filters.minPrice !== undefined ||
              filters.maxPrice !== undefined) && (
              <FilterChip
                label={`${filters.minPrice ? formatPrice(filters.minPrice) : "Any"} - ${
                  filters.maxPrice ? formatPrice(filters.maxPrice) : "Any"
                }`}
                onRemove={clearPrice}
              />
            )}
            {filters.sort !== "newest" && (
              <FilterChip
                label={sortLabels[filters.sort]}
                onRemove={() => pushFilters({ ...filters, sort: "newest" })}
              />
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 border-border bg-transparent px-4 shadow-none hover:shadow-none"
              leftIcon={<RotateCcw className="size-4" />}
              onClick={resetFilters}
              text="Reset"
            />
          </div>
        )}

        <section aria-busy={isLoading} aria-label="Filtered products">
          {isRefreshing ? (
            <ProductGridSkeleton />
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">
              {error}
            </p>
          ) : cards.length === 0 ? (
            <EmptyProductsState onReset={resetFilters} />
          ) : (
            <ProductGrid products={cards} />
          )}
          {isPaginating && (
            <p className="py-5 text-center text-sm text-muted-foreground">
              Loading more pieces...
            </p>
          )}
          {hasMore && (
            <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          )}
        </section>
      </div>
    </div>
  );
}

type FilterPanelProps = {
  categories: ProductFilterOptions["categories"];
  colors: string[];
  sizes: string[];
  filters: ProductCatalogFilters;
  priceRange: ProductFilterOptions["price"];
  onApplyPrice: (event: FormEvent<HTMLFormElement>) => void;
  onClearPrice: () => void;
  onReset: () => void;
  onToggle: (key: MultiFilterKey, value: string, checked: boolean) => void;
};

function FilterPanel({
  categories,
  colors,
  filters,
  onApplyPrice,
  onClearPrice,
  onReset,
  onToggle,
  priceRange,
  sizes,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Filters</h2>
          <p className="text-xs text-muted-foreground">
            {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-9 border-border bg-transparent shadow-none hover:shadow-none"
          onClick={onReset}
          aria-label="Reset filters"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <FilterGroup title="Category">
        {categories.map((category) => (
          <CheckboxRow
            key={category.slug}
            checked={isChecked(filters.categories, category.slug)}
            label={category.name}
            onCheckedChange={(checked) =>
              onToggle("category", category.slug, checked)
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() =>
                onToggle("color", color, !isChecked(filters.colors, color))
              }
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-left text-xs font-semibold transition-all",
                isChecked(filters.colors, color)
                  ? "border-foreground bg-foreground text-background shadow-md shadow-primary/30"
                  : "border-border bg-background text-foreground hover:border-primary",
              )}
            >
              <span
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: colorSwatches[color] ?? color }}
                aria-hidden="true"
              />
              <span className="truncate">{color}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() =>
                onToggle("size", size, !isChecked(filters.sizes, size))
              }
              className={cn(
                "h-9 min-w-11 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-all",
                isChecked(filters.sizes, size)
                  ? "border-foreground bg-foreground text-primary shadow-md shadow-primary/30"
                  : "border-border bg-background text-foreground hover:border-primary",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <form
          key={`${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}`}
          className="space-y-3"
          onSubmit={onApplyPrice}
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Min
              </span>
              <Input
                name="minPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={filters.minPrice ?? ""}
                placeholder={String(priceRange.min)}
                className="rounded-full"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Max
              </span>
              <Input
                name="maxPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={filters.maxPrice ?? ""}
                placeholder={String(priceRange.max)}
                className="rounded-full"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" size="sm" text="Apply" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClearPrice}
              text="Clear"
            />
          </div>
        </form>
      </FilterGroup>
    </div>
  );
}

type FilterGroupProps = {
  children: ReactNode;
  title: string;
};

function FilterGroup({ children, title }: FilterGroupProps) {
  return (
    <div className="space-y-3 border-t border-border/70 pt-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

type CheckboxRowProps = {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

function CheckboxRow({ checked, label, onCheckedChange }: CheckboxRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted/70">
      <span>{label}</span>
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </label>
  );
}

type FilterChipProps = {
  label: string;
  onRemove: () => void;
  swatch?: string;
};

function FilterChip({ label, onRemove, swatch }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-primary/50 bg-primary/15 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary/25"
    >
      {swatch && (
        <span
          className="size-3 rounded-full border border-border"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      )}
      {label}
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function EmptyProductsState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary/20 text-foreground">
        <Filter className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        No pieces match these filters
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Try widening the price range or removing a color, size, or category.
      </p>
      <Button
        type="button"
        className="mt-5"
        leftIcon={<RotateCcw className="size-4" />}
        onClick={onReset}
        text="Reset filters"
      />
    </div>
  );
}
