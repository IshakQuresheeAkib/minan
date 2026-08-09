import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { getCollectionPath, publicRoutes } from "@/constants/routes";
import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import {
  hasCatalogQuery,
  parseCatalogFilters,
  type ProductSearchParams,
} from "@/features/products/lib/catalog-filters";
import {
  getCachedProductFilterOptions,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import type { ProductFilterOptions } from "@/features/products/services/product.service";
import { filteredCatalogRobots } from "@/lib/seo/metadata";
import { getCollectionStructuredData } from "@/lib/seo/structured-data";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductSearchParams>;
};

type ProductCategory = ProductFilterOptions["categories"][number];

function getCollectionDescription(categoryName: string): string {
  return `Shop ${categoryName.toLowerCase()} from MINAN's latest fashion collection in Bangladesh. Explore premium styles, sizes, colors, and easy nationwide ordering.`;
}

function findCategory(
  categories: ProductFilterOptions["categories"],
  slug: string,
): ProductCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

export async function generateMetadata({
  params,
  searchParams,
}: CollectionPageProps): Promise<Metadata> {
  await connection();

  const [{ slug }, query, filterOptions] = await Promise.all([
    params,
    searchParams,
    getCachedProductFilterOptions(),
  ]);
  const category = findCategory(filterOptions.categories, slug);

  if (!category) {
    return {
      title: "Collection Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} Fashion Collection in Bangladesh`;
  const description = getCollectionDescription(category.name);
  const canonical = getCollectionPath(category.slug);
  const filtered = hasCatalogQuery(query);

  return {
    title,
    description,
    alternates: { canonical },
    robots: filtered ? filteredCatalogRobots : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: [
        {
          url: category.image_url,
          alt: `${category.name} collection at MINAN`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image_url],
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  await connection();

  const [{ slug }, query, filterOptions] = await Promise.all([
    params,
    searchParams,
    getCachedProductFilterOptions(),
  ]);
  const category = findCategory(filterOptions.categories, slug);

  if (!category) {
    notFound();
  }

  const filters = parseCatalogFilters(query, category.slug);
  const products = await getCachedProducts({
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
  });

  return (
    <>
      <JsonLd data={getCollectionStructuredData(category)} />
      <section className="mx-auto w-full max-w-11/12 py-10 2xl:px-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1.5 text-sm text-foreground/70"
        >
          <Link href={publicRoutes.home} className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <Link href={publicRoutes.products} className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span aria-current="page" className="font-medium text-foreground">
            {category.name}
          </span>
        </nav>

        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">
            {category.name} Collection
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-foreground/70">
            {getCollectionDescription(category.name)}
          </p>
        </div>

        <ProductCatalog
          filters={filters}
          filterOptions={filterOptions}
          fixedCategorySlug={category.slug}
          initialData={products}
        />
      </section>
    </>
  );
}
