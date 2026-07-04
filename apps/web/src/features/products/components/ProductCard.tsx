"use client";

import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

export type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  colors: readonly ProductColorClass[];
};

type ProductColorClass =
  | "bg-primary"
  | "bg-secondary"
  | "bg-foreground/70"
  | "bg-foreground";

type ProductCardProps = {
  imagePriority?: boolean;
  product: ProductCardData;
};

export function ProductCard({ imagePriority = false, product }: ProductCardProps) {
  const productHref = `/products/${product.slug}`;

  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-[0_8px_24px_rgba(151,72,34,0.04)]">
      <div className="relative mb-3 aspect-4/5 overflow-hidden rounded-xl bg-muted">
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
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>
        ) : (
          <div
            className="absolute inset-0 bg-linear-to-b from-muted to-input"
            aria-hidden="true"
          />
        )}
        <Button
          href={productHref}
          size="sm"
          className="absolute right-2 bottom-2 z-10 border-0 bg-primary/70 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-sm hover:translate-y-0 hover:bg-primary/80 hover:text-foreground hover:shadow-sm"
          leftIcon={
            <ShoppingBag
              className="size-4 text-foreground"
              aria-hidden="true"
            />
          }
          text="Shop"
        />
      </div>
      <div>
        <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="mb-2 truncate text-xs text-foreground/70">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">
            BDT {product.price}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {product.colors.map((color) => (
              <span
                key={color}
                className={`size-3 rounded-full border border-border ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
