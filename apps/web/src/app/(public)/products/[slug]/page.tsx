import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/features/products/components/ProductDetails";
import {
  getProductBySlug,
  getRelatedProducts,
  mapProductToCard,
} from "@/features/products/services/product.service";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

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
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product, 4);

  return (
    <ProductDetails
      product={product}
      relatedProducts={relatedProducts.map(mapProductToCard)}
    />
  );
}
