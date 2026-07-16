import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import type { ProductColorSwatch } from "@/features/products/constants/product-colors";

export type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  colors: readonly ProductColorSwatch[];
};

type ProductCardProps = {
  imagePriority?: boolean;
  product: ProductCardData;
};

export function ProductCard({
  imagePriority = false,
  product,
}: ProductCardProps) {
  const productHref = `/products/${product.slug}`;
  const formattedPrice = `BDT ${product.price.toLocaleString("en-BD")}`;

  return (
    <article className="rounded-2xl border border-secondary bg-background p-3 shadow-[0_8px_24px_rgba(151,72,34,0.04)]">
      <div className="relative mb-3 aspect-4/5 overflow-hidden rounded-xl bg-background">
        {product.imageUrl ? (
          <Link
            href={productHref}
            aria-label={`View details for ${product.name}`}
            className="group absolute inset-0 cursor-pointer"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority={imagePriority}
              sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="transition-transform duration-500 ease-out group-hover:scale-105"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </Link>
        ) : (
          <div
            className="absolute inset-0 bg-linear-to-b from-background to-secondary"
            aria-hidden="true"
          />
        )}
        <Button
          href={productHref}
          size="sm"
          className="absolute right-2 bottom-2 z-10 border-0 bg-primary/70 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-sm hover:translate-y-0 hover:bg-primary/80 hover:text-foreground hover:shadow-sm"
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          text="View"
        />
      </div>
      <div>
        <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
          <Link
            href={productHref}
            className="transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mb-2 truncate text-xs text-foreground/70">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            {formattedPrice}
          </span>
          <div className="flex gap-1" aria-label="Available colors">
            {product.colors.map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="size-3 rounded-full border border-secondary"
                style={{ backgroundColor: color.swatch }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
