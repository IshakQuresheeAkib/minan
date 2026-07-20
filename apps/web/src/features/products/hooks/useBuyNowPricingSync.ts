"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { getProductPriceQuote } from "@/features/products/services/product.service";
import { useBuyNowStore } from "@/store/buy-now.store";

export function useBuyNowPricingSync(): void {
  const item = useBuyNowStore((state) => state.item);
  const hasHydrated = useBuyNowStore((state) => state.hasHydrated);
  const applyPricingQuote = useBuyNowStore(
    (state) => state.applyPricingQuote,
  );
  const productId = item?.productId;

  useEffect(() => {
    if (!hasHydrated || !productId) {
      return;
    }

    let cancelled = false;

    void getProductPriceQuote([productId])
      .then((quote) => {
        if (cancelled) {
          return;
        }

        const result = applyPricingQuote(quote);
        if (result.priceChanged) {
          toast.info("This product was updated with its latest price.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not refresh the current product price.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyPricingQuote, hasHydrated, productId]);
}
