"use client";

import { ArrowLeft, Heart, Minus, Plus, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { publicRoutes } from "@/constants/routes";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { SizeColorSelector } from "@/features/products/components/SizeColorSelector";
import type { Product } from "@/features/products/schemas/product.schema";
import { useCartStore } from "@/store/cart.store";

const DESCRIPTION_PREVIEW_LENGTH = 120;

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const shouldTruncate =
    product.description.length > DESCRIPTION_PREVIEW_LENGTH;
  const description =
    expandedDescription || !shouldTruncate
      ? product.description
      : `${product.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`;

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      return;
    }

    if (product.colors.length > 0 && !selectedColor) {
      return;
    }

    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
      imageUrl: product.images[0],
    });

    router.push(publicRoutes.cart);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden font-sans text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background px-6 pb-4 pt-14">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex size-12 items-center justify-center rounded-full bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>

        <h1 className="font-display text-xl font-bold tracking-tight">
          Details
        </h1>

        <div className="flex h-12 items-center gap-4 rounded-full bg-card px-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            aria-label="Share product"
            onClick={() => {
              void handleShare();
            }}
            className="transition-transform active:scale-95"
          >
            <Share2 className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 pb-32">
        <ProductGallery
          images={product.images}
          name={product.name}
          price={product.price}
        />

        <section aria-label="Product information">
          <h2 className="mb-2 text-[22px] font-bold leading-tight tracking-tight">
            {product.name}
          </h2>

          <p className="mb-6 text-lg font-bold text-foreground">
            BDT {product.price.toLocaleString("en-BD")}
          </p>

          <SizeColorSelector
            sizes={product.sizes}
            colors={product.colors}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSizeChange={setSelectedSize}
            onColorChange={setSelectedColor}
          />

          <div className="mt-8">
            <h3 className="mb-3 text-[17px] font-bold text-foreground">
              Description
            </h3>
            <p className="text-[15px] leading-relaxed text-foreground/80">
              {description}{" "}
              {shouldTruncate ? (
                <button
                  type="button"
                  onClick={() => setExpandedDescription((current) => !current)}
                  className="font-semibold text-foreground hover:underline"
                >
                  {expandedDescription ? "Read Less" : "Read More"}
                </button>
              ) : null}
            </p>
          </div>
        </section>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] items-center gap-4 bg-background/80 px-6 pb-8 pt-4 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 rounded-full border border-black/5 bg-card px-2 shadow-sm">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-4 text-center text-[17px] font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((current) => current + 1)}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="h-14 flex-1 rounded-full bg-primary text-[16px] font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(151,72,34,0.25)] transition-transform active:scale-95"
        >
          Add to Cart
        </button>
      </footer>

      <div
        className="pointer-events-none fixed bottom-2 left-0 right-0 z-60 flex justify-center"
        aria-hidden="true"
      >
        <div className="h-[5px] w-[134px] rounded-full bg-foreground" />
      </div>
    </div>
  );
}
