"use client";

import { Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useTransition,
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
import { SearchBar } from "@/features/home/components/SearchBar";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";
import { productColorSwatches } from "@/features/products/constants/product-colors";
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

export type ProductCatalogFilters = {
  categories: string[];
  subcategories: string[];
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

type MultiFilterKey = "category" | "subcategory" | "color" | "size";

function formatPrice(value: number) {
  return `BDT ${value.toLocaleString("en-BD")}`;
}

function normalizePriceRange(
  minPrice: number | undefined,
  maxPrice: number | undefined,
) {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return {
      minPrice: maxPrice,
      maxPrice: minPrice,
    };
  }

  return {
    minPrice,
    maxPrice,
  };
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
  const [isPending, startTransition] = useTransition();

  const { products, isLoading, isRefreshing, error, loadMore, hasMore, total } =
    useProducts({
      category: filters.categories,
      subcategories: filters.subcategories,
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
  const subcategoryDetailsBySlug = useMemo(
    () =>
      new Map(
        filterOptions.categories.flatMap((category) =>
          category.subcategories.map(
            (subcategory) =>
              [
                subcategory.slug,
                {
                  categoryName: category.name,
                  categorySlug: category.slug,
                  name: subcategory.name,
                },
              ] as const,
          ),
        ),
      ),
    [filterOptions.categories],
  );

  function buildUrl(nextFilters: ProductCatalogFilters) {
    const params = new URLSearchParams();

    nextFilters.categories.forEach((category) => {
      params.append("category", category);
    });
    nextFilters.subcategories.forEach((subcategory) => {
      params.append("subcategory", subcategory);
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
      subcategory: filters.subcategories,
      color: filters.colors,
      size: filters.sizes,
    };
    const current = map[key];
    const nextValues = checked
      ? [...new Set([...current, value])]
      : current.filter((item) => item !== value);

    const nextCategories = key === "category" ? nextValues : filters.categories;
    const nextSubcategories =
      key === "subcategory"
        ? nextValues
        : key === "category" && !checked
          ? filters.subcategories.filter((subcategory) => {
              const details = subcategoryDetailsBySlug.get(subcategory);
              return details?.categorySlug !== value;
            })
          : filters.subcategories;

    pushFilters({
      ...filters,
      categories: nextCategories,
      subcategories: nextSubcategories,
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
    const normalizedRange = normalizePriceRange(
      minPrice !== undefined && Number.isFinite(minPrice)
        ? Math.max(0, minPrice)
        : undefined,
      maxPrice !== undefined && Number.isFinite(maxPrice)
        ? Math.max(0, maxPrice)
        : undefined,
    );

    pushFilters({
      ...filters,
      ...normalizedRange,
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
      subcategories: [],
      colors: [],
      sizes: [],
      sort: "newest",
    });
  }

  function clearSearch() {
    pushFilters({
      ...filters,
      search: undefined,
    });
  }

  function applySearch(search: string) {
    const normalizedSearch = search.trim();
    pushFilters({
      ...filters,
      search: normalizedSearch || undefined,
    });
  }

  const activeFilterCount =
    filters.categories.length +
    filters.subcategories.length +
    filters.colors.length +
    filters.sizes.length +
    (filters.search ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.sort !== "newest" ? 1 : 0);
  const cards = products.map(mapProductToCard);
  const hasCards = cards.length > 0;
  const showRefreshingProducts = (isPending || isRefreshing) && hasCards;
  const showInitialSkeleton = (isPending || isRefreshing) && !hasCards;
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
        <div className="sticky top-24 rounded-2xl border border-secondary/80 bg-background/80 p-4 shadow-[0_16px_48px_rgba(151,72,34,0.08)] backdrop-blur">
          {renderFilterPanel()}
        </div>
      </aside>

      <div className="min-w-0">
        <SearchBar
          key={filters.search ?? "catalog-search"}
          variant="catalog"
          initialQuery={filters.search ?? ""}
          onSearchSubmit={applySearch}
          className="mb-5"
        />

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-secondary/80 bg-background/80 p-3 shadow-[0_12px_36px_rgba(151,72,34,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {total.toLocaleString("en-BD")} result{total === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-foreground/70">
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
                <SheetHeader className="border-b border-secondary/70 px-5 py-4">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine the collection by fit, shade, and price.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-5 py-4">{renderFilterPanel()}</div>
                <SheetFooter className="border-t border-secondary/70">
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
            {filters.search && (
              <FilterChip
                label={`Search: "${filters.search}"`}
                onRemove={clearSearch}
              />
            )}
            {filters.categories.map((category) => (
              <FilterChip
                key={category}
                label={categoryLabelBySlug.get(category) ?? category}
                onRemove={() => toggleMultiFilter("category", category, false)}
              />
            ))}
            {filters.subcategories.map((subcategory) => {
              const details = subcategoryDetailsBySlug.get(subcategory);
              return (
                <FilterChip
                  key={subcategory}
                  label={
                    details
                      ? `${details.categoryName}: ${details.name}`
                      : subcategory
                  }
                  onRemove={() =>
                    toggleMultiFilter("subcategory", subcategory, false)
                  }
                />
              );
            })}
            {filters.colors.map((color) => (
              <FilterChip
                key={color}
                label={color}
                swatch={productColorSwatches[color]}
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
                label={`${
                  filters.minPrice !== undefined
                    ? formatPrice(filters.minPrice)
                    : "Any"
                } - ${
                  filters.maxPrice !== undefined
                    ? formatPrice(filters.maxPrice)
                    : "Any"
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
              className="h-9 border-secondary bg-transparent px-4 shadow-none hover:shadow-none"
              leftIcon={<RotateCcw className="size-4" />}
              onClick={resetFilters}
              text="Reset"
            />
          </div>
        )}

        <section
          aria-busy={isLoading || isPending}
          aria-label="Filtered products"
        >
          {showRefreshingProducts && (
            <div
              className="mb-3 h-1 overflow-hidden rounded-full bg-primary/15"
              aria-hidden="true"
            >
              <span className="block h-full w-1/3 rounded-full bg-primary/80 animate-pulse" />
            </div>
          )}
          {showInitialSkeleton ? (
            <ProductGridSkeleton />
          ) : error && !hasCards ? (
            <CatalogErrorState error={error} onRetry={() => router.refresh()} />
          ) : cards.length === 0 ? (
            <EmptyProductsState onReset={resetFilters} />
          ) : (
            <div
              className={cn(
                "transition-opacity duration-200",
                showRefreshingProducts && "opacity-60",
              )}
            >
              <ProductGrid products={cards} />
            </div>
          )}
          {error && hasCards && (
            <div className="mt-4">
              <CatalogErrorState
                error={error}
                onRetry={() => router.refresh()}
              />
            </div>
          )}
          {isPaginating && (
            <p className="py-5 text-center text-sm text-foreground/70">
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
  const selectedCategories = categories.filter((category) =>
    filters.categories.includes(category.slug),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Filters</h2>
          <p className="text-xs text-foreground/70">
            {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-9 border-secondary bg-transparent shadow-none hover:shadow-none"
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

      {selectedCategories.some(
        (category) => category.subcategories.length > 0,
      ) ? (
        <FilterGroup title="Subcategory">
          <div className="space-y-4">
            {selectedCategories.map((category) =>
              category.subcategories.length > 0 ? (
                <div key={category.slug} className="space-y-1">
                  <h4 className="px-2 text-xs font-semibold text-foreground/65">
                    {category.name}
                  </h4>
                  {category.subcategories.map((subcategory) => (
                    <CheckboxRow
                      key={subcategory.slug}
                      checked={isChecked(
                        filters.subcategories,
                        subcategory.slug,
                      )}
                      label={subcategory.name}
                      onCheckedChange={(checked) =>
                        onToggle("subcategory", subcategory.slug, checked)
                      }
                    />
                  ))}
                </div>
              ) : null,
            )}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup title="Color">
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              aria-pressed={isChecked(filters.colors, color)}
              onClick={() =>
                onToggle("color", color, !isChecked(filters.colors, color))
              }
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-left text-xs font-semibold transition-all",
                isChecked(filters.colors, color)
                  ? "border-foreground bg-foreground text-background shadow-md shadow-primary/30"
                  : "border-secondary bg-background text-foreground hover:border-primary",
              )}
            >
              <span
                className="size-4 rounded-full border border-secondary"
                style={{
                  backgroundColor: productColorSwatches[color] ?? color,
                }}
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
              aria-pressed={isChecked(filters.sizes, size)}
              onClick={() =>
                onToggle("size", size, !isChecked(filters.sizes, size))
              }
              className={cn(
                "h-9 min-w-11 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-all",
                isChecked(filters.sizes, size)
                  ? "border-foreground bg-foreground text-background shadow-md shadow-primary/30"
                  : "border-secondary bg-background text-foreground hover:border-primary",
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
              <span className="text-xs font-medium text-foreground/70">
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
              <span className="text-xs font-medium text-foreground/70">
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
    <div className="space-y-3 border-t border-secondary/70 pt-4">
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
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-background/70">
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
      aria-label={`Remove ${label} filter`}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-primary/50 bg-primary/15 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary/25"
    >
      {swatch && (
        <span
          className="size-3 rounded-full border border-secondary"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      )}
      {label}
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function CatalogErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-destructive">{error}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={onRetry}
        text="Try again"
      />
    </div>
  );
}

function EmptyProductsState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-secondary bg-background/30 px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary/20 text-foreground">
        <Filter className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        No pieces match these filters
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
        Try widening the price range or removing a category, subcategory, color,
        or size.
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
