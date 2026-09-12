import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { Suspense, type ReactNode } from "react";
import { preload } from "react-dom";

import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { ProductCatalogSkeleton } from "@/features/products/components/ProductCatalogSkeleton";
import { productCardImageSizes } from "@/features/products/components/ProductCard";
import {
  hasCatalogQuery,
  parseCatalogFilters,
  type ProductSearchParams,
} from "@/features/products/lib/catalog-filters";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import {
  toCatalogProductList,
  type GetProductsOptions,
} from "@/features/products/services/product.service";
import { filteredCatalogRobots } from "@/lib/seo/metadata";

const productsSocialImage = {
  url: "/hero/limited-offer.webp",
  width: 1200,
  height: 720,
  alt: "MINAN premium fashion collection in Bangladesh",
} as const;

type ProductsPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const filtered = hasCatalogQuery(await searchParams);
  const title = "Shop Premium Fashion Online in Bangladesh";
  const description =
    "Shop MINAN's premium fashion collection in Bangladesh. Browse shirts, pants, panjabi, footwear, women's styles, kids' clothing, and more.";

  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/products",
      images: [productsSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [productsSocialImage.url],
    },
    robots: filtered ? filteredCatalogRobots : undefined,
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const filters = parseCatalogFilters(await searchParams);

  return (
    <ProductsPageFrame filters={filters}>
      <Suspense fallback={<ProductCatalogSkeleton />}>
        <RequestedProductsPage filters={filters} />
      </Suspense>
    </ProductsPageFrame>
  );
}

async function RequestedProductsPage({
  filters,
}: {
  filters: ReturnType<typeof parseCatalogFilters>;
}) {
  const [products, filterOptions] = await Promise.all([
    getCachedProducts(getProductsOptions(filters)),
    getCachedProductFilterOptions(),
  ]);
  const imageUrl = products.data[0]?.images[0];

  if (imageUrl) {
    const { props } = getImageProps({
      src: imageUrl,
      alt: "",
      fill: true,
      sizes: productCardImageSizes,
    });

    preload(props.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: props.sizes,
      imageSrcSet: props.srcSet,
    });
  }

  return (
    <ProductCatalog
      filters={filters}
      filterOptions={filterOptions}
      initialData={toCatalogProductList(products)}
    />
  );
}

function ProductsPageFrame({
  children,
  filters,
}: {
  children: ReactNode;
  filters: ReturnType<typeof parseCatalogFilters>;
}) {
  return (
    <section className="mx-auto w-full max-w-11/12 py-10 2xl:px-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">
          {filters.search
            ? `Search results for "${filters.search}"`
            : "Products"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground/70">
          {filters.search
            ? "Browse matching pieces from the current MINAN collection."
            : "Premium daily wear selected for fast browsing and easy ordering."}
        </p>
      </div>
      {children}
    </section>
  );
}

function getProductsOptions(
  filters: ReturnType<typeof parseCatalogFilters>,
): GetProductsOptions {
  return {
    category: filters.categories,
    subcategories: filters.subcategories,
    colors: filters.colors,
    sizes: filters.sizes,
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: 1,
    limit: 20,
  };
}
