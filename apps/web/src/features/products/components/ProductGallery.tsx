"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
  price: number;
};

export function ProductGallery({ images, name, price }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return (
      <div className="mb-8 flex h-[380px] items-center justify-center rounded-[32px] bg-muted text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <section className="relative mb-8" aria-label="Product gallery">
      <div className="relative h-[380px] w-full overflow-hidden rounded-[32px] bg-card shadow-sm">
        <Image
          src={activeImage}
          alt={name}
          fill
          priority
          sizes="(max-width: 430px) 100vw, 430px"
          className="object-cover object-top"
        />
        <div className="absolute bottom-4 right-4 flex items-end gap-2">
          <div className="flex items-center gap-2 rounded-full bg-card py-2 pr-5 pl-2 shadow-lg">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-xs font-semibold">৳</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Shop</span>
          </div>
          <div className="rounded-full bg-card px-5 py-3 shadow-lg">
            <span className="text-[15px] font-bold text-foreground">
              BDT {price.toLocaleString("en-BD")}
            </span>
          </div>
        </div>
      </div>

      {images.length > 1 ? (
        <div
          className="mt-5 flex justify-center gap-2"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View image ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  isActive ? "bg-foreground" : "bg-foreground/20",
                )}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
