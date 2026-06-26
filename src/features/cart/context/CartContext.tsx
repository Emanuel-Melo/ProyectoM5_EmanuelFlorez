import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { Product } from "../../products/types/product.types";

import { useAuth } from "../../auth/hooks/useAuth";
import {
  getUserCart,
  syncUserCart,
} from "../services/cartService";

export type CartItem = Product & { quantity: number };
// Define un tipo CartContextValue que representa el valor del contexto del carrito de compras, incluyendo los elementos del carrito (items), la cantidad total de elementos (count) y funciones para agregar, eliminar, actualizar la cantidad y limpiar el carrito.
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
// Define una función readFromStorage que lee los elementos del carrito de compras desde el almacenamiento local (localStorage) y devuelve un arreglo de CartItem. Si no hay elementos almacenados o ocurre un error, devuelve un arreglo vacío.
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
// Define una función addCartItem que agrega un producto al carrito de compras. Si el producto ya existe en el carrito, actualiza la cantidad, asegurándose de que no exceda el stock disponible ni la cantidad máxima permitida (3). Si el producto no existe, lo agrega al carrito con la cantidad deseada.
function addCartItem(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const index = items.findIndex((item) => item.id === product.id);
  const maxQuantity = Math.min(3, Math.max(0, product.stock));
  const desiredQuantity = Math.max(0, quantity);
  if (index >= 0) {
    return items.map((item, idx) => {
      if (idx !== index) return item;

      const newQuantity = Math.min(maxQuantity, item.quantity + desiredQuantity);
      return item.quantity === newQuantity ? item : { ...item, quantity: newQuantity };
    });
  }

  if (maxQuantity <= 0) {
    return items;
  }

  const finalQuantity = Math.min(maxQuantity, desiredQuantity || 1);
  if (finalQuantity <= 0) {
    return items;
  }

  return [...items, { ...product, quantity: finalQuantity }];
}
// Define una función cartReducer que maneja las acciones del carrito de compras, como establecer los elementos, agregar un producto, eliminar un producto, actualizar la cantidad y limpiar el carrito. Devuelve el nuevo estado del carrito según la acción realizada.
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
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(
                Math.min(3, item.stock),
                Math.max(1, quantity)
              ),
            }
          : item
      );
    }
    case "clear":
      return [];
    default:
      return state;
  }
}
// Define un componente CartProvider que proporciona el contexto del carrito de compras a sus componentes hijos. Utiliza useReducer para manejar el estado del carrito y sincroniza los elementos del carrito con el almacenamiento local y la base de datos según el usuario autenticado.
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
// Define un efecto que sincroniza los elementos del carrito con la base de datos si el usuario está autenticado y no está en estado de carga. Si el usuario no está autenticado, guarda los elementos del carrito en el almacenamiento local.
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
// Define el valor del contexto del carrito de compras, incluyendo los elementos del carrito, la cantidad total de elementos y las funciones para agregar, eliminar, actualizar la cantidad y limpiar el carrito.
  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, count }}
    >
      {children}
    </CartContext.Provider>
  );
}
// Define un hook useCart que permite acceder al contexto del carrito de compras desde cualquier componente hijo del CartProvider. Lanza un error si se utiliza fuera del CartProvider.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default CartContext;
