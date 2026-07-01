import {
  ProductCard,
  type ProductCardData,
} from "@/features/products/components/ProductCard";

type RelatedProductsProps = {
  products: ProductCardData[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-products-heading"
      className="mt-12 border-t border-border pt-10 lg:mt-16 lg:pt-12"
    >
      <h2
        id="related-products-heading"
        className="mb-6 text-xl font-semibold tracking-normal text-foreground"
      >
        You may also like
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
