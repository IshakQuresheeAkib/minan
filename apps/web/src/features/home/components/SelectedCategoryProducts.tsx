"use client";

import { type ReactNode, useEffect, useState } from "react";

import { CategoryProductGrid } from "@/features/home/components/ProductsSection";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import {
  getProducts,
  type HomeCatalogProductGroup,
} from "@/features/products/services/product.service";

type SelectedCategory = {
  imageUrl: string;
  name: string;
  slug: string;
};

type SelectedCategoryProductsProps = {
  category: SelectedCategory;
  initialContent: ReactNode;
};

type SelectedCategoryRequestState = {
  error: string | null;
  products: HomeCatalogProductGroup["products"] | null;
  requestKey: number;
  slug: string;
};

export function SelectedCategoryProducts({
  category,
  initialContent,
}: SelectedCategoryProductsProps) {
  const [requestKey, setRequestKey] = useState(0);
  const [requestState, setRequestState] =
    useState<SelectedCategoryRequestState | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;

    void getProducts({ category: category.slug })
      .then((products) => {
        if (!isCurrentRequest) {
          return;
        }

        setRequestState({
          error: null,
          products,
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

  if (currentRequest?.products) {
    return (
      <CategoryProductGrid
        group={{
          category: {
            image_url: category.imageUrl,
            name: category.name,
            slug: category.slug,
          },
          products: currentRequest.products,
        }}
        showViewMore={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      {initialContent}
      {currentRequest?.error ? (
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
      ) : (
        <SelectedCategoryProductSkeletons categoryName={category.name} />
      )}
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
