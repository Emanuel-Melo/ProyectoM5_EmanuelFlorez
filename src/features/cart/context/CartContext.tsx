import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "../../products/types/product.types";

export type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CART_KEY = "cart_items_v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (err) {
    return [];
  }
}

function writeToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (err) {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readFromStorage());

  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const clear = () => setItems([]);

  const count = items.reduce((s, it) => s + (it.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default CartContext;
