import {
  ProductCard,
  type ProductCardData,
} from "@/features/products/components/ProductCard";

const products: ProductCardData[] = [
  {
    slug: "floral-lace-elegance",
    name: "Floral Lace Elegance",
    description: "Bloom with elegance.",
    price: 1600,
    colors: ["bg-chart-2", "bg-foreground"],
  },
  {
    slug: "sleek-satin-glamour",
    name: "Sleek Satin Glamour",
    description: "Satin, sleek, glamorous.",
    price: 1200,
    colors: ["bg-chart-5", "bg-foreground"],
  },
  {
    slug: "premium-cotton-tee",
    name: "Premium Cotton Tee",
    description: "Everyday comfort, premium feel.",
    price: 950,
    colors: ["bg-primary", "bg-chart-5"],
  },
  {
    slug: "oxford-shirt",
    name: "Oxford Shirt",
    description: "Sharp lines for work and weekend.",
    price: 1450,
    colors: ["bg-secondary", "bg-foreground"],
  },
];

export function ProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
