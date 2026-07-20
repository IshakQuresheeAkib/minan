import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProductPriceQuote } from "@/features/products/services/product.service";

export const CART_OPTION_FALLBACK = "N/A";

export type CartItem = {
  lineId: string;
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

export type CartItemInput = Omit<
  CartItem,
  "lineId" | "size" | "color" | "isAvailable"
> & {
  size?: string;
  color?: string;
};

export type PricingSyncResult = {
  priceChanged: boolean;
  unavailableCount: number;
};

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  addItem: (item: CartItemInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  applyPricingQuote: (
    quote: readonly ProductPriceQuote[],
  ) => PricingSyncResult;
  clearCart: () => void;
};

export function normalizeCartOption(value: string | undefined): string {
  const normalized = value?.trim();
  return normalized ? normalized : CART_OPTION_FALLBACK;
}

function createLineId(productId: string, size: string, color: string): string {
  return [productId, size, color].map(encodeURIComponent).join("__");
}

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

function sanitizeCartItem(value: unknown): CartItem | null {
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

  const size = normalizeCartOption(getOptionalString(value.size));
  const color = normalizeCartOption(getOptionalString(value.color));
  const price = getNonNegativeNumber(value.price);

  if (price === null) {
    return null;
  }

  return {
    lineId: createLineId(productId, size, color),
    productId,
    slug,
    name,
    price,
    originalPrice: getNonNegativeNumber(value.originalPrice) ?? price,
    discount: getDiscount(value.discount),
    isAvailable:
      typeof value.isAvailable === "boolean" ? value.isAvailable : true,
    quantity: Math.max(1, Math.floor(value.quantity)),
    size,
    color,
    imageUrl: getOptionalString(value.imageUrl),
  };
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const itemByLineId = new Map<string, CartItem>();

  for (const item of value) {
    const sanitizedItem = sanitizeCartItem(item);

    if (!sanitizedItem) {
      continue;
    }

    const existingItem = itemByLineId.get(sanitizedItem.lineId);

    if (existingItem) {
      itemByLineId.set(sanitizedItem.lineId, {
        ...existingItem,
        quantity: existingItem.quantity + sanitizedItem.quantity,
      });
      continue;
    }

    itemByLineId.set(sanitizedItem.lineId, sanitizedItem);
  }

  return [...itemByLineId.values()];
}

function getPersistedItems(value: unknown): CartItem[] {
  if (!isRecord(value)) {
    return [];
  }

  return sanitizeCartItems(value.items);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
      addItem: (item) => {
        set((state) => ({
          items: (() => {
            const size = normalizeCartOption(item.size);
            const color = normalizeCartOption(item.color);
            const lineId = createLineId(item.productId, size, color);
            const existingItem = state.items.find(
              (current) => current.lineId === lineId,
            );

            if (existingItem) {
              return state.items.map((current) =>
                current.lineId === lineId
                  ? {
                      ...current,
                      price: item.price,
                      originalPrice: item.originalPrice,
                      discount: item.discount,
                      isAvailable: true,
                      quantity: current.quantity + item.quantity,
                    }
                  : current,
              );
            }

            return [
              ...state.items,
              {
                ...item,
                lineId,
                size,
                color,
                isAvailable: true,
              },
            ];
          })(),
        }));
      },
      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        }));
      },
      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId
              ? {
                  ...item,
                  quantity: Math.max(1, quantity),
                }
              : item,
          ),
        }));
      },
      applyPricingQuote: (quote) => {
        const quoteByProductId = new Map(
          quote.map((item) => [item.product_id, item]),
        );
        let priceChanged = false;

        const items = get().items.map((item) => {
          const currentQuote = quoteByProductId.get(item.productId);

          if (!currentQuote) {
            return item;
          }

          if (!currentQuote.is_available) {
            return { ...item, isAvailable: false };
          }

          if (
            item.price !== currentQuote.discounted_price ||
            item.originalPrice !== currentQuote.price ||
            item.discount !== currentQuote.discount
          ) {
            priceChanged = true;
          }

          return {
            ...item,
            price: currentQuote.discounted_price,
            originalPrice: currentQuote.price,
            discount: currentQuote.discount,
            isAvailable: true,
          };
        });

        set({ items });
        return {
          priceChanged,
          unavailableCount: items.filter((item) => !item.isAvailable).length,
        };
      },
      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: "minan-cart-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        items: state.items,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        items: getPersistedItems(persistedState),
      }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    },
  ),
);
