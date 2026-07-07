import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetails } from "@/features/products/components/ProductDetails";
import { ProductDetailsSkeleton } from "@/features/products/components/ProductDetailsSkeleton";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { RelatedProductsSkeleton } from "@/features/products/components/RelatedProductsSkeleton";
import {
  getCachedProductBySlug,
  getCachedProducts,
} from "@/features/products/services/product.cache";
import { mapProductToCard } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/schemas/product.schema";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description,
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
    <ProductDetails product={product}>
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <ProductRelatedProducts product={product} />
      </Suspense>
    </ProductDetails>
  );
}

async function ProductRelatedProducts({
  product,
}: {
  product: Product;
}) {
  if (!product.category) {
    return <RelatedProducts products={[]} />;
  }

  const { data: relatedProducts } = await getCachedProducts({
    category: product.category.slug,
    exclude: product.slug,
    limit: 4,
  });

  return <RelatedProducts products={relatedProducts.map(mapProductToCard)} />;
}
