import { create } from "zustand";

export type AuthModalMode = "login" | "signup";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  open: (mode?: AuthModalMode) => void;
  close: () => void;
  switchMode: () => void;
}

/**
 * Global auth modal state.
 * Any component can call `useAuthModal().open()` to show the login modal.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",

  open: (mode: AuthModalMode = "login") => {
    set({ isOpen: true, mode });
  },

  close: () => {
    set({ isOpen: false });
  },

  switchMode: () => {
    set((state) => ({
      mode: state.mode === "login" ? "signup" : "login",
    }));
  },
}));
