import type { Metadata } from "next";
import { connection } from "next/server";

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await connection();

  const params = await searchParams;
  const filters = parseCatalogFilters(params);
  const [products, filterOptions] = await Promise.all([
    getCachedProducts({
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
    }),
    getCachedProductFilterOptions(),
  ]);

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
      <ProductCatalog
        filters={filters}
        filterOptions={filterOptions}
        initialData={products}
      />
    </section>
  );
}
