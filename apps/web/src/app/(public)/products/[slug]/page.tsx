import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { getProductPath } from "@/constants/routes";
import { ProductDetails } from "@/features/products/components/ProductDetails";
import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { RelatedProductsSkeleton } from "@/features/products/components/RelatedProductsSkeleton";
import {
  getCachedProductBySlug,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import {
  getRelatedProductsOptions,
  mapProductToCard,
} from "@/features/products/services/product.service";
import type { Product } from "@/features/products/schemas/product.schema";
import { getProductStructuredData } from "@/lib/seo/structured-data";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function getMetaDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = getMetaDescription(product.description);
  const image = product.images[0];
  const productPath = getProductPath(product.slug);

  return {
    title: product.name,
    description,
    alternates: {
      canonical: productPath,
    },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: productPath,
      images: image
        ? [
            {
              url: image,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}

async function ProductDetailContent({ slug }: { slug: string }) {
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd data={getProductStructuredData(product)} />
      <ProductDetails product={product}>
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <ProductRelatedProducts product={product} />
        </Suspense>
      </ProductDetails>
    </>
  );
}

async function ProductRelatedProducts({
  product,
}: {
  product: Product;
}) {
  const relatedProductsOptions = getRelatedProductsOptions(product);

  if (!relatedProductsOptions) {
    return <RelatedProducts products={[]} />;
  }

  const { data: relatedProducts } = await getCachedProducts(
    relatedProductsOptions,
  );

  return <RelatedProducts products={relatedProducts.map(mapProductToCard)} />;
}
