"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getProductPriceQuote } from "@/features/products/services/product.service";
import { useCartStore } from "@/store/cart.store";

export function useCartPricingSync(onSettled?: () => void): void {
  const onSettledRef = useRef(onSettled);
  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const applyPricingQuote = useCartStore((state) => state.applyPricingQuote);
  const productIdsKey = [...new Set(items.map((item) => item.productId))]
    .sort()
    .join(",");

  useEffect(() => {
    if (!hasHydrated || !productIdsKey) {
      return;
    }

    let cancelled = false;

    void getProductPriceQuote(productIdsKey.split(","))
      .then((quote) => {
        if (cancelled) {
          return;
        }

        const result = applyPricingQuote(quote);
        onSettledRef.current?.();
        if (result.priceChanged) {
          toast.info("Your cart was updated with the latest prices.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          onSettledRef.current?.();
          toast.error("Could not refresh current product prices.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyPricingQuote, hasHydrated, productIdsKey]);
}
