"use client";

import {
  ArrowLeft,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { publicRoutes } from "@/constants/routes";
import { ProductBreadcrumbs } from "@/features/products/components/ProductBreadcrumbs";
import { ProductDescription } from "@/features/products/components/ProductDescription";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import { SizeGuideModal } from "@/features/products/components/SizeGuideModal";
import { SizeColorSelector } from "@/features/products/components/SizeColorSelector";
import { TrustBadges } from "@/features/products/components/TrustBadges";
import type { ProductDetail } from "@/features/products/schemas/product.schema";
import { openWhatsAppOrder } from "@/lib/analytics/whatsapp";
import { useBuyNowStore } from "@/store/buy-now.store";
import { useCartStore, type CartItemInput } from "@/store/cart.store";

type ProductDetailsProps = {
  children?: ReactNode;
  product: ProductDetail;
};

export function ProductDetails({ children, product }: ProductDetailsProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const setBuyNowItem = useBuyNowStore((state) => state.setItem);
  const galleryRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const isProductUnavailable = !product.is_active;
  const discount = product.discount;
  const originalPrice = product.price;
  const discounted_price = product.discounted_price;
  const savings = originalPrice - discounted_price;
  const hasDiscount = discount > 0 && discounted_price < originalPrice;

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!desktopQuery.matches || reducedMotion.matches) {
      return;
    }

    const galleryEl = galleryRef.current;
    const infoEl = infoRef.current;

    if (!galleryEl || !infoEl) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.fromTo(
          galleryEl,
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
        );
        gsap.fromTo(
          infoEl,
          { opacity: 0, x: 24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.55,
            delay: 0.08,
            ease: "power2.out",
          },
        );
      });

      cleanup = () => {
        ctx.revert();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

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

  const getSelectedCartItem = (): CartItemInput | null => {
    if (isProductUnavailable) {
      return null;
    }

    if (product.sizes.length > 0 && !selectedSize) {
      return null;
    }

    if (product.colors.length > 0 && !selectedColor) {
      return null;
    }

    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.discounted_price,
      originalPrice: product.price,
      discount: product.discount,
      quantity,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
      imageUrl: product.images[0],
    };
  };

  const handleAddToCart = () => {
    const selectedItem = getSelectedCartItem();

    if (selectedItem) {
      addItem(selectedItem);
      router.push(publicRoutes.cart);
    }
  };

  const handleBuyNow = () => {
    const selectedItem = getSelectedCartItem();

    if (selectedItem) {
      setBuyNowItem(selectedItem);
      router.push(publicRoutes.buyNowCheckout);
    }
  };

  const handleWhatsAppOrder = () => {
    if (isProductUnavailable) {
      return;
    }

    void openWhatsAppOrder({
      productId: product._id,
      categoryId: product.category_id,
      productName: product.name,
      productUrl: window.location.href,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden font-sans text-foreground lg:min-h-0">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-background/95 px-4 pb-3 pt-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex size-11 items-center justify-center rounded-full bg-background shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Share product"
          onClick={() => {
            void handleShare();
          }}
          className="flex size-11 items-center justify-center rounded-full bg-background shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-95"
        >
          <Share2 className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-64 lg:px-8 lg:pb-16 lg:pt-6">
        <ProductBreadcrumbs
          category={product.category}
          subcategory={product.subcategory}
          productName={product.name}
        />

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-16">
          <div ref={galleryRef} className="lg:sticky lg:top-6">
            <ProductGallery
              images={product.images}
              name={product.name}
              price={product.discounted_price}
              originalPrice={product.price}
              discount={product.discount}
            />
          </div>

          <div ref={infoRef}>
            <section aria-label="Product information">
              <div className="mb-4 hidden items-start justify-between gap-4 lg:flex">
                <div>
                  <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                    {product.name}
                  </h1>
                  <ProductPrice
                    className="mt-3 flex flex-wrap items-center gap-2"
                    price={product.discounted_price}
                    originalPrice={product.price}
                    discount={product.discount}
                    size="lg"
                  />
                  {hasDiscount ? (
                  <p className="mt-4 flex w-fit basis-full items-center gap-1 rounded-full border border-primary/25 bg-primary/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-foreground uppercase">
                    <Tag className="size-3" aria-hidden="true" />
                    Save Tk {savings.toLocaleString("en-BD")} · {discount}% off
                  </p>
                ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Share product"
                  onClick={() => {
                    void handleShare();
                  }}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-secondary bg-background transition-colors hover:bg-background"
                >
                  <Share2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <h2 className="mb-2 text-[22px] font-bold leading-tight tracking-tight lg:hidden">
                {product.name}
              </h2>

              <ProductPrice
                className="mb-6 lg:hidden"
                price={product.discounted_price}
                originalPrice={product.price}
                discount={product.discount}
              />

              <div className="mb-4 flex items-center justify-end lg:justify-start">
                <SizeGuideModal />
              </div>

              <SizeColorSelector
                sizes={product.sizes}
                colors={product.colors}
                selectedSize={selectedSize}
                selectedColor={selectedColor}
                onSizeChange={setSelectedSize}
                onColorChange={setSelectedColor}
              />

              <div className="mt-8 hidden items-center gap-3 lg:flex">
                <span className="text-sm font-semibold text-foreground">
                  Quantity
                </span>
                <div className="flex h-12 items-center gap-3 rounded-full border border-secondary bg-background px-2">
                  <Button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    variant="secondary"
                    size="icon"
                    className="size-9 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-background hover:text-foreground hover:shadow-none disabled:opacity-40"
                    icon={<Minus className="size-4" aria-hidden="true" />}
                  />
                  <span className="w-4 text-center text-base font-semibold">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) => current + 1)}
                    size="icon"
                    className="size-9 bg-primary p-0 text-background shadow-none hover:translate-y-0 hover:bg-primary/90 hover:text-background hover:shadow-md active:scale-95"
                    icon={<Plus className="size-4" aria-hidden="true" />}
                  />
                </div>
              </div>

              <div className="mt-6 hidden lg:block">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isProductUnavailable}
                  className="h-12 w-full cursor-pointer rounded-full"
                  onClick={handleWhatsAppOrder}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {isProductUnavailable ? "Sold Out" : "Order on WhatsApp"}
                </Button>
              </div>

              <TrustBadges />

              <div className="mt-8">
                <h3 className="mb-3 text-[17px] font-bold text-foreground lg:text-lg">
                  Description
                </h3>
                <ProductDescription
                  description={product.description}
                  descriptionHtml={product.description_html}
                />
              </div>
            </section>
          </div>
        </div>

        {children}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-background/80 px-4 pb-8 pt-4 backdrop-blur-md lg:hidden">
        <Button
          type="button"
          variant="secondary"
          disabled={isProductUnavailable}
          className="h-11 w-full cursor-pointer rounded-full"
          onClick={handleWhatsAppOrder}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {isProductUnavailable ? "Sold Out" : "Order on WhatsApp"}
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex h-14 items-center gap-3 rounded-full border border-foreground/5 bg-background px-2 shadow-sm">
            <Button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              variant="secondary"
              size="icon"
              className="size-10 border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-background hover:text-foreground hover:shadow-none active:bg-background disabled:opacity-40"
              icon={<Minus className="size-4" aria-hidden="true" />}
            />
            <span className="w-4 text-center text-[17px] font-semibold">
              {quantity}
            </span>
            <Button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((current) => current + 1)}
              size="icon"
              className="size-10 bg-primary p-0 text-background shadow-md hover:translate-y-0 hover:bg-primary/90 hover:text-background hover:shadow-md active:scale-95"
              icon={<Plus className="size-4" aria-hidden="true" />}
            />
          </div>

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={isProductUnavailable}
            variant="secondary"
            className="h-14 flex-1 border-secondary bg-background text-[15px] font-semibold text-foreground shadow-sm hover:translate-y-0 hover:bg-background hover:text-foreground hover:shadow-sm active:scale-95"
            text={isProductUnavailable ? "Sold Out" : "Add to Cart"}
          />
        </div>

        <Button
          type="button"
          onClick={handleBuyNow}
          disabled={isProductUnavailable}
          className="h-14 w-full bg-primary text-[16px] font-semibold text-background shadow-[0_8px_20px_rgba(151,72,34,0.25)] hover:translate-y-0 hover:bg-primary/90 hover:text-background hover:shadow-[0_8px_20px_rgba(151,72,34,0.25)] active:scale-95"
          leftIcon={<ShoppingBag className="size-4" aria-hidden="true" />}
          text={isProductUnavailable ? "Sold Out" : "Buy Now"}
        />
      </footer>

      <div className="fixed bottom-6 right-6 z-50 hidden items-center gap-3 lg:flex">
        <Button
          type="button"
          size="lg"
          onClick={handleAddToCart}
          disabled={isProductUnavailable}
          variant="secondary"
          className="h-14 cursor-pointer rounded-full bg-background px-8 text-base font-semibold text-foreground shadow-[0_8px_24px_rgba(151,72,34,0.18)] hover:translate-y-0 hover:bg-background hover:text-foreground"
        >
          {isProductUnavailable ? "Sold Out" : "Add to Cart"}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleBuyNow}
          disabled={isProductUnavailable}
          className="h-14 cursor-pointer rounded-full px-8 text-base font-semibold shadow-[0_8px_24px_rgba(151,72,34,0.35)]"
          leftIcon={<ShoppingBag className="size-4" aria-hidden="true" />}
        >
          {isProductUnavailable ? "Sold Out" : "Buy Now"}
        </Button>
      </div>

      <div
        className="pointer-events-none fixed bottom-2 left-0 right-0 z-60 flex justify-center lg:hidden"
        aria-hidden="true"
      >
        <div className="h-[5px] w-[134px] rounded-full bg-foreground" />
      </div>
    </div>
  );
}
