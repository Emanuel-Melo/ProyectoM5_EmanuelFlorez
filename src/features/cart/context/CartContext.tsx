import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { Product } from "../../products/types/product.types";

import { useAuth } from "../../auth/hooks/useAuth";
import {
  getUserCart,
  syncUserCart,
} from "../services/cartService";

export type CartItem = Product & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

type CartAction =
  | { type: "set"; payload: { items: CartItem[] } }
  | { type: "add"; payload: { product: Product; quantity: number } }
  | { type: "remove"; payload: { productId: string } }
  | { type: "updateQuantity"; payload: { productId: string; quantity: number } }
  | { type: "clear" };

const GUEST_CART_KEY = "guest_cart_items_v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (err) {
    return [];
  }
}

function writeToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    // ignore
  }
}

function addCartItem(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const index = items.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    return items.map((item, idx) =>
      idx === index ? { ...item, quantity: item.quantity + quantity } : item
    );
  }

  return [...items, { ...product, quantity }];
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "set":
      return action.payload.items;
    case "add":
      return addCartItem(state, action.payload.product, action.payload.quantity);
    case "remove":
      return state.filter((item) => item.id !== action.payload.productId);
    case "updateQuantity": {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter((item) => item.id !== productId);
      }
      return state.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    }
    case "clear":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [items, dispatch] = useReducer(cartReducer, [], readFromStorage);
  const isInitializing = useRef(true);

  useEffect(() => {
    let ignore = false;

    const loadCart = async () => {
      if (!user) {
        dispatch({ type: "set", payload: { items: readFromStorage() } });
        isInitializing.current = false;
        return;
      }

      try {
        const userCart = await getUserCart(user.uid);
        if (!ignore) {
          dispatch({ type: "set", payload: { items: userCart } });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          isInitializing.current = false;
        }
      }
    };

    void loadCart();

    return () => {
      ignore = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (user && !loading && !isInitializing.current) {
      void syncUserCart(user.uid, items).catch((error) => {
        console.error("Error sincronizando carrito:", error);
      });
      return;
    }

    writeToStorage(items);
  }, [items, user?.uid, loading]);

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: "add", payload: { product, quantity } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: "remove", payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "updateQuantity", payload: { productId, quantity } });
  };

  const clear = () => {
    dispatch({ type: "clear" });
  };

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, count }}
    >
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
