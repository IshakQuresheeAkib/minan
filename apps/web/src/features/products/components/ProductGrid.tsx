import Link from "next/link";

import { Button } from "@/components/ui/button";

const products = [
  {
    slug: "premium-cotton-tee",
    name: "Premium Cotton Tee",
    category: "T-Shirts",
    price: 950,
  },
  {
    slug: "oxford-shirt",
    name: "Oxford Shirt",
    category: "Shirts",
    price: 1450,
  },
  {
    slug: "daily-chino",
    name: "Daily Chino",
    category: "Pants",
    price: 1850,
  },
] as const;

export function ProductGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.slug} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="aspect-[4/3] rounded-md bg-secondary" />
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">{product.category}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-normal">{product.name}</h3>
            <p className="mt-2 text-sm font-medium">BDT {product.price}</p>
          </div>
          <Button asChild className="mt-4 w-full">
            <Link href={`/products/${product.slug}`}>View Product</Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
