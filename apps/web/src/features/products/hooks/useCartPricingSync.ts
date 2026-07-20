"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { getProductPriceQuote } from "@/features/products/services/product.service";
import { useCartStore } from "@/store/cart.store";

export function useCartPricingSync(): void {
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
        if (result.priceChanged) {
          toast.info("Your cart was updated with the latest prices.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not refresh current product prices.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyPricingQuote, hasHydrated, productIdsKey]);
}
