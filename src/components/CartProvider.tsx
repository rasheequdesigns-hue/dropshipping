"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: { size?: string; color?: string }) => void;
  removeItem: (productId: string, variant?: { size?: string; color?: string }) => void;
  updateQuantity: (productId: string, quantity: number, variant?: { size?: string; color?: string }) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const store = useCartStore();
  const [isCartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  return (
    <CartContext.Provider
      value={{
        items: hydrated ? store.items : [],
        addItem: store.addItem,
        removeItem: store.removeItem,
        updateQuantity: store.updateQuantity,
        clearCart: store.clearCart,
        total: hydrated ? store.getTotal() : 0,
        itemCount: hydrated ? store.getItemCount() : 0,
        isCartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
