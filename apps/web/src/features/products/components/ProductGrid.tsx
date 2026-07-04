import {
  ProductCard,
  type ProductCardData,
} from "@/features/products/components/ProductCard";

type ProductGridProps = {
  products: ProductCardData[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-foreground/70">No products available yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          imagePriority={index < 2}
          product={product}
        />
      ))}
    </div>
  );
}
