import { create } from "zustand";

type OrdersNotificationsState = {
  unreadCount: number;
  addUnreadOrders: (count: number) => void;
  markOrdersRead: () => void;
};

export const useOrdersNotificationsStore = create<OrdersNotificationsState>(
  (set) => ({
    unreadCount: 0,
    addUnreadOrders: (count) => {
      if (count < 1) return;
      set((state) => ({ unreadCount: state.unreadCount + count }));
    },
    markOrdersRead: () => {
      set({ unreadCount: 0 });
    },
  }),
);
