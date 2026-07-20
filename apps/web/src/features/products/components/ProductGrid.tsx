import type { ReactNode } from "react";

import {
  ProductCard,
  type ProductCardData,
} from "@/features/products/components/ProductCard";

type ProductGridProps = {
  leadingItem?: ReactNode;
  products: ProductCardData[];
};

export function ProductGrid({ leadingItem, products }: ProductGridProps) {
  if (products.length === 0 && !leadingItem) {
    return (
      <p className="text-sm text-foreground/70">No products available yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {leadingItem}
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          imagePriority={index < (leadingItem ? 1 : 2)}
          product={product}
        />
      ))}
      {products.length === 0 && (
        <p className="self-center text-sm text-foreground/70">
          No products available in this category yet.
        </p>
      )}
    </div>
  );
}
