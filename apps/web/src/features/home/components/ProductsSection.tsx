"use client";

import { useEffect, useState } from "react";

import { CategoryGridCard } from "@/features/home/components/CategoryGridCard";
import { ProductCard } from "@/features/products/components/ProductCard";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import {
  getProducts,
  mapProductToCard,
  type HomeCatalogProductGroup,
} from "@/features/products/services/product.service";

export type HomeCategoryProductGroup = HomeCatalogProductGroup;

type ProductsSectionProps = {
  activeCategorySlug?: string;
  categoryGroups: HomeCategoryProductGroup[];
};

export function ProductsSection({
  activeCategorySlug,
  categoryGroups,
}: ProductsSectionProps) {
  const activeGroup = activeCategorySlug
    ? categoryGroups.find(
        (group) => group.category.slug === activeCategorySlug,
      )
    : undefined;
  const visibleGroups = categoryGroups.filter(
    (group) => group.products.data.length > 0,
  );

  if (activeCategorySlug) {
    if (!activeGroup || activeGroup.products.total === 0) {
      return (
        <p className="py-10 text-center text-sm text-foreground/70">
          No products available in this category yet.
        </p>
      );
    }

    return <SelectedCategoryProductGrid group={activeGroup} />;
  }

  if (visibleGroups.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground/70">
        No products available yet.
      </p>
    );
  }

  return (
    <section className="space-y-10 xl:space-y-12" aria-label="Products by category">
      {visibleGroups.map((group) => (
        <CategoryProductGrid key={group.category.slug} group={group} />
      ))}
    </section>
  );
}

type CategoryProductGridProps = {
  group: HomeCategoryProductGroup;
  products?: HomeCategoryProductGroup["products"]["data"];
  showViewMore?: boolean;
};

function CategoryProductGrid({
  group,
  products = group.products.data,
  showViewMore = true,
}: CategoryProductGridProps) {
  const { category } = group;
  const visibleProducts = showViewMore ? products.slice(0, 7) : products;
  const cardProducts = visibleProducts.map(mapProductToCard);
  const viewMoreHref = `/products?category=${encodeURIComponent(category.slug)}`;
  const compactHasMore = showViewMore && group.products.total > 5;
  const desktopHasMore = showViewMore && group.products.total > 7;
  const titleId = `home-category-${category.slug}`;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {category.name}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <CategoryGridCard
          imageUrl={category.image_url}
          name={category.name}
          slug={category.slug}
        />
        {cardProducts.map((product, index) => {
          const isCompactTerminal = index === 4 && compactHasMore;
          const isDesktopOnly = showViewMore && index > 4;
          const isDesktopTerminal = index === 6 && desktopHasMore;

          if (isCompactTerminal) {
            return (
              <div key={product.slug} className="contents">
                <div className="h-full xl:hidden">
                  <ProductCard
                    product={product}
                    wholeCardCta={{
                      href: viewMoreHref,
                      label: `View more ${category.name} products`,
                      overlayText: "View more",
                    }}
                  />
                </div>
                <div className="hidden h-full xl:block">
                  <ProductCard product={product} />
                </div>
              </div>
            );
          }

          return (
            <div
              key={product.slug}
              className={isDesktopOnly ? "hidden h-full xl:block" : "h-full"}
            >
              <ProductCard
                product={product}
                wholeCardCta={
                  isDesktopTerminal
                    ? {
                        href: viewMoreHref,
                        label: `View more ${category.name} products`,
                        overlayText: "View more",
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

type SelectedCategoryRequestState = {
  error: string | null;
  products: HomeCategoryProductGroup["products"]["data"] | null;
  requestKey: number;
  slug: string;
};

function SelectedCategoryProductGrid({
  group,
}: {
  group: HomeCategoryProductGroup;
}) {
  const [requestKey, setRequestKey] = useState(0);
  const [requestState, setRequestState] =
    useState<SelectedCategoryRequestState | null>(null);
  const { category } = group;

  useEffect(() => {
    let isCurrentRequest = true;

    void getProducts({ category: category.slug })
      .then((result) => {
        if (!isCurrentRequest) {
          return;
        }

        setRequestState({
          error: null,
          products: result.data,
          requestKey,
          slug: category.slug,
        });
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) {
          return;
        }

        setRequestState({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load all products",
          products: null,
          requestKey,
          slug: category.slug,
        });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [category.slug, requestKey]);

  const currentRequest =
    requestState?.slug === category.slug &&
    requestState.requestKey === requestKey
      ? requestState
      : null;
  const products = currentRequest?.products ?? group.products.data;
  const isLoading = currentRequest === null;

  return (
    <div className="space-y-4">
      <CategoryProductGrid
        group={group}
        products={products}
        showViewMore={false}
      />
      {isLoading ? (
        <SelectedCategoryProductSkeletons categoryName={category.name} />
      ) : currentRequest.error ? (
        <div
          className="min-h-5 text-center text-sm text-foreground/70"
          aria-live="polite"
        >
          <p>
            {currentRequest.error}.{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-foreground/75 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              onClick={() => setRequestKey((current) => current + 1)}
            >
              Try again
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SelectedCategoryProductSkeletons({
  categoryName,
}: {
  categoryName: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={`Loading more ${categoryName} products`}
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
