import { create } from "zustand";

export type AdminRole = "general" | "premium";

type AuthState = {
  accessToken: string | null;
  role: AdminRole | null;
  setSession: (session: { accessToken: string; role: AdminRole }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  setSession: (session) => {
    set({
      accessToken: session.accessToken,
      role: session.role,
    });
  },
  clearSession: () => {
    set({
      accessToken: null,
      role: null,
    });
  },
}));
