import { create } from "zustand";

import type { CustomerSession } from "@/features/order-tracking/lib/types";

type CustomerAuthState = {
  session: CustomerSession | null;
  status: "unknown" | "authenticated" | "anonymous";
  setSession: (session: CustomerSession) => void;
  clearSession: () => void;
};

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  session: null,
  status: "unknown",
  setSession: (session) => set({ session, status: "authenticated" }),
  clearSession: () => set({ session: null, status: "anonymous" }),
}));
