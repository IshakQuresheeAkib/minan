import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  setSession: (session: { accessToken: string }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setSession: (session) => {
    set({
      accessToken: session.accessToken,
    });
  },
  clearSession: () => {
    set({
      accessToken: null,
    });
  },
}));
