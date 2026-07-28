import { ArrowRight, ShoppingCart, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductDetailsLink } from "@/features/products/components/ProductDetailsLink";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import { productCardShellClassName } from "@/features/products/components/product-card.styles";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl?: string;
};

type ProductCardProps = {
  imagePriority?: boolean;
  product: ProductCardData;
  wholeCardCta?: {
    href: string;
    label: string;
    overlayText: string;
  };
};

export function ProductCard({
  imagePriority = false,
  product,
  wholeCardCta,
}: ProductCardProps) {
  const productHref = `/products/${product.slug}`;
  const hasDiscount =
    product.discount > 0 && product.price < product.originalPrice;
  const savings = product.originalPrice - product.price;

  return (
    <article className={productCardShellClassName}>
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/15">
        {product.imageUrl && !wholeCardCta ? (
          <ProductDetailsLink
            href={productHref}
            aria-label={`View ${product.name}`}
            className="group/image absolute inset-0 cursor-pointer focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/60 focus-visible:outline-none"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority={imagePriority}
              sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-500 ease-out motion-safe:group-hover/image:scale-[1.035]"
            />
          </ProductDetailsLink>
        ) : product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            priority={imagePriority}
            sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.035]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-linear-to-br from-secondary/25 via-background to-primary/15"
            aria-hidden="true"
          />
        )}

        {hasDiscount ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-destructive/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-background shadow-sm sm:left-3 sm:top-3 sm:text-xs">
            -{product.discount}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2 sm:p-3">
        <h3 className="line-clamp-2 min-h-7 text-sm font-semibold text-foreground">
          {wholeCardCta ? (
            product.name
          ) : (
            <ProductDetailsLink
              href={productHref}
              className="cursor-pointer transition-colors duration-200 hover:text-foreground/75 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              {product.name}
            </ProductDetailsLink>
          )}
        </h3>

        <div className="mt-auto flex flex-col">
          {hasDiscount ? (
            <div className="-mb-1.5 sm:-mb-3 mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/90 px-1.5 sm:px-2 py-1 text-[9px] font-bold text-foreground">
              <Tag className="size-2.5" aria-hidden="true" />
              Save Tk {savings.toLocaleString("en-BD")}
            </div>
          ) : null}

          <div className="flex items-end justify-between">
            <ProductPrice
              price={product.price}
              originalPrice={product.originalPrice}
              discount={product.discount}
              size="sm"
            />

            {!wholeCardCta ? (
              <ProductDetailsLink
                href={productHref}
                aria-label={`Choose options for ${product.name}`}
                title="Choose options"
                className="flex size-8 sm:size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-[background-color,color,box-shadow] duration-200 hover:bg-primary hover:text-foreground hover:shadow-md focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                <ShoppingCart className="size-4 sm:size-5" aria-hidden="true" />
              </ProductDetailsLink>
            ) : <p aria-hidden className=" size-8 sm:size-10 invisible"/>}
          </div>
        </div>
      </div>

      {wholeCardCta && (
        <Link
          href={wholeCardCta.href}
          aria-label={wholeCardCta.label}
          className="group/view-more absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-foreground/70 text-background transition-colors duration-200 hover:bg-foreground/80 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/70 focus-visible:outline-none"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-background/35 bg-foreground/65 px-4 py-2 text-sm font-bold shadow-lg backdrop-blur-sm transition-colors duration-200 group-hover/view-more:border-primary group-hover/view-more:text-primary sm:text-base">
            {wholeCardCta.overlayText}
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      )}
    </article>
  );
}
