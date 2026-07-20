import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProductPriceQuote } from "@/features/products/services/product.service";
import type { CartItemInput } from "@/store/cart.store";
import type { PricingSyncResult } from "@/store/cart.store";
import { normalizeCartOption } from "@/store/cart.store";

export type BuyNowItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  isAvailable: boolean;
  quantity: number;
  size: string;
  color: string;
  imageUrl?: string;
};

type BuyNowState = {
  item: BuyNowItem | null;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setItem: (item: CartItemInput) => void;
  applyPricingQuote: (
    quote: readonly ProductPriceQuote[],
  ) => PricingSyncResult;
  clearItem: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function getNonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getDiscount(value: unknown): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
    ? value
    : 0;
}

function createBuyNowItem(item: CartItemInput): BuyNowItem {
  return {
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
    discount: item.discount,
    isAvailable: true,
    quantity: Math.max(1, Math.floor(item.quantity)),
    size: normalizeCartOption(item.size),
    color: normalizeCartOption(item.color),
    imageUrl: item.imageUrl,
  };
}

function sanitizeBuyNowItem(value: unknown): BuyNowItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productId = getRequiredString(value.productId);
  const slug = getRequiredString(value.slug);
  const name = getRequiredString(value.name);

  if (
    !productId ||
    !slug ||
    !name ||
    getNonNegativeNumber(value.price) === null ||
    typeof value.quantity !== "number" ||
    !Number.isFinite(value.quantity)
  ) {
    return null;
  }

  const price = getNonNegativeNumber(value.price);

  if (price === null) {
    return null;
  }

  return {
    productId,
    slug,
    name,
    price,
    originalPrice: getNonNegativeNumber(value.originalPrice) ?? price,
    discount: getDiscount(value.discount),
    isAvailable:
      typeof value.isAvailable === "boolean" ? value.isAvailable : true,
    quantity: Math.max(1, Math.floor(value.quantity)),
    size: normalizeCartOption(getOptionalString(value.size)),
    color: normalizeCartOption(getOptionalString(value.color)),
    imageUrl: getOptionalString(value.imageUrl),
  };
}

function getPersistedItem(value: unknown): BuyNowItem | null {
  if (!isRecord(value)) {
    return null;
  }

  return sanitizeBuyNowItem(value.item);
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set, get) => ({
      item: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
      setItem: (item) => {
        set({ item: createBuyNowItem(item) });
      },
      applyPricingQuote: (quote) => {
        const item = get().item;

        if (!item) {
          return { priceChanged: false, unavailableCount: 0 };
        }

        const currentQuote = quote.find(
          (quoteItem) => quoteItem.product_id === item.productId,
        );

        if (!currentQuote) {
          return {
            priceChanged: false,
            unavailableCount: item.isAvailable ? 0 : 1,
          };
        }

        if (!currentQuote.is_available) {
          set({ item: { ...item, isAvailable: false } });
          return { priceChanged: false, unavailableCount: 1 };
        }

        const priceChanged =
          item.price !== currentQuote.discounted_price ||
          item.originalPrice !== currentQuote.price ||
          item.discount !== currentQuote.discount;

        set({
          item: {
            ...item,
            price: currentQuote.discounted_price,
            originalPrice: currentQuote.price,
            discount: currentQuote.discount,
            isAvailable: true,
          },
        });
        return { priceChanged, unavailableCount: 0 };
      },
      clearItem: () => {
        set({ item: null });
      },
    }),
    {
      name: "minan-buy-now-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        item: state.item,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        item: getPersistedItem(persistedState),
      }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    },
  ),
);
