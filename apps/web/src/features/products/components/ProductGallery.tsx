"use client";

import Image from "next/image";
import { useState } from "react";

import { ProductPrice } from "@/features/products/components/ProductPrice";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
};

export function ProductGallery({
  images,
  name,
  price,
  originalPrice,
  discount,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return (
      <div className="mb-8 flex h-[380px] items-center justify-center rounded-[32px] bg-background text-sm text-foreground/70 lg:mb-0 lg:h-[520px] lg:rounded-2xl">
        No image available
      </div>
    );
  }

  return (
    <section className="relative mb-8 lg:mb-0" aria-label="Product gallery">
      <div className="lg:flex lg:gap-4">
        {images.length > 1 ? (
          <div
            className="mb-5 hidden flex-col gap-3 lg:mb-0 lg:flex"
            role="group"
            aria-label="Product image thumbnails"
          >
            {images.map((image, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={image}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:outline-none",
                    isActive ? "border-primary" : "border-secondary",
                  )}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative h-[380px] w-full overflow-hidden rounded-[32px] bg-background shadow-sm lg:h-[520px] lg:flex-1 lg:rounded-2xl">
          <Image
            src={activeImage}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top"
          />
          <div className="absolute bottom-4 right-4 flex items-end gap-2 lg:hidden">
            <div className="flex items-center gap-2 rounded-full bg-background py-2 pr-5 pl-2 shadow-lg">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-foreground">
                <span className="text-xs font-semibold">৳</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Shop
              </span>
            </div>
            <div className="rounded-full bg-background px-5 py-3 shadow-lg">
              <ProductPrice
                price={price}
                originalPrice={originalPrice}
                discount={discount}
                showOriginalPrice={false}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {images.length > 1 ? (
        <div
          className="mt-5 flex justify-center gap-2 lg:hidden"
          role="group"
          aria-label="Product images"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image}
                type="button"
                aria-pressed={isActive}
                aria-label={`View image ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className="grid size-9 place-items-center rounded-full transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    isActive ? "bg-foreground" : "bg-foreground/20",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
