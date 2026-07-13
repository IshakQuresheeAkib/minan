import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItemInput } from "@/store/cart.store";
import { normalizeCartOption } from "@/store/cart.store";

export type BuyNowItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
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

function createBuyNowItem(item: CartItemInput): BuyNowItem {
  return {
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
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
    typeof value.price !== "number" ||
    !Number.isFinite(value.price) ||
    value.price < 0 ||
    typeof value.quantity !== "number" ||
    !Number.isFinite(value.quantity)
  ) {
    return null;
  }

  return {
    productId,
    slug,
    name,
    price: value.price,
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
    (set) => ({
      item: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
      setItem: (item) => {
        set({ item: createBuyNowItem(item) });
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
