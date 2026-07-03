import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const CART_OPTION_FALLBACK = "N/A";

export type CartItem = {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  imageUrl?: string;
};

export type CartItemInput = Omit<CartItem, "lineId" | "size" | "color"> & {
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  addItem: (item: CartItemInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
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
    typeof value.price !== "number" ||
    !Number.isFinite(value.price) ||
    value.price < 0 ||
    typeof value.quantity !== "number" ||
    !Number.isFinite(value.quantity)
  ) {
    return null;
  }

  const size = normalizeCartOption(getOptionalString(value.size));
  const color = normalizeCartOption(getOptionalString(value.color));

  return {
    lineId: createLineId(productId, size, color),
    productId,
    slug,
    name,
    price: value.price,
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
    (set) => ({
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
