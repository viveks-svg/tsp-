"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "report";
  image?: string;
  description?: string;
}

interface CartContextValue {
  cart: CartItem[];
  cartOpen: boolean;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

const CART_STORAGE_KEY = "tsp_shop_cart";

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, setPendingAction } = useAuth();
  const authModal = useAuthModal();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {
      // ignore storage errors
    }

    setIsMounted(true);
  }, []);

  const [prevAuth, setPrevAuth] = useState(isAuthenticated);

  useEffect(() => {
    if (!isMounted) return;

    if (prevAuth && !isAuthenticated) {
      setCart([]);
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
    setPrevAuth(isAuthenticated);
  }, [isAuthenticated, prevAuth, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart, isMounted]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((current) => current.id === item.id && current.type === item.type);
      if (existing) {
        return prev.map((current) =>
          current.id === item.id && current.type === item.type
            ? { ...current, quantity: current.quantity + 1 }
            : current
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCartOpen,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
