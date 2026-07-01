import { create } from "zustand";

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

export const useCartStore = create<CartState>((set) => ({
  items: [],
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
}));
