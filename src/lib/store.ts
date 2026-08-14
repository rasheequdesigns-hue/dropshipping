import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "./supabase";

interface CartStore {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    variant?: { size?: string; color?: string }
  ) => void;
  removeItem: (
    productId: string,
    variant?: { size?: string; color?: string }
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variant?: { size?: string; color?: string }
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const variantKey = (v?: { size?: string; color?: string }) =>
  JSON.stringify(v ?? {});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const idx = state.items.findIndex(
            (i) =>
              i.product.id === product.id &&
              variantKey(i.variant) === variantKey(variant)
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
            return { items: next };
          }
          return { items: [...state.items, { product, quantity, variant }] };
        });
      },

      removeItem: (productId, variant) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.product.id === productId &&
                variantKey(i.variant) === variantKey(variant)
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId &&
            variantKey(i.variant) === variantKey(variant)
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce(
          (sum, i) => sum + i.product.sale_price * i.quantity,
          0
        ),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "peadia-cart" }
  )
);
