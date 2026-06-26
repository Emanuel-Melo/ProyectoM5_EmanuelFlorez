import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { Product } from "../../products/types/product.types";

import { useAuth } from "../../auth/hooks/useAuth";
import {
  getUserFavorites,
  syncUserFavorites,
} from "../services/favoriteService";

export type FavoriteItem = Product;
// Define un tipo FavoritesContextValue que representa el valor del contexto de favoritos, incluyendo los elementos favoritos, la cantidad, y las funciones para verificar, alternar, eliminar y limpiar favoritos.
type FavoritesContextValue = {
  items: FavoriteItem[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

type FavoritesAction =
  | { type: "set"; payload: { items: FavoriteItem[] } }
  | { type: "toggle"; payload: { product: Product } }
  | { type: "remove"; payload: { productId: string } }
  | { type: "clear" };

const GUEST_FAVORITES_KEY = "guest_favorite_items_v1";

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
// Establece el nombre del contexto para fines de depuración.
function readFavoritesFromStorage(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}
//Escribe una función writeFavoritesToStorage que toma un arreglo de FavoriteItem y lo guarda en el almacenamiento local como una cadena JSON. Si ocurre un error al escribir, se ignora.
function writeFavoritesToStorage(items: FavoriteItem[]) {
  try {
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}
// Define un reductor favoritesReducer que maneja las acciones de establecer, alternar, eliminar y limpiar elementos favoritos en el estado.
function favoritesReducer(state: FavoriteItem[], action: FavoritesAction): FavoriteItem[] {
  switch (action.type) {
    case "set":
      return action.payload.items;
    case "toggle": {
      const product = action.payload.product;
      const existing = state.find((item) => item.id === product.id);
      if (existing) {
        return state.filter((item) => item.id !== product.id);
      }
      return [...state, product];
    }
    case "remove":
      return state.filter((item) => item.id !== action.payload.productId);
    case "clear":
      return [];
    default:
      return state;
  }
}
// Define un componente FavoritesProvider que envuelve a sus hijos con el contexto de favoritos. El proveedor maneja la carga inicial de favoritos desde la base de datos o el almacenamiento local, y sincroniza los cambios en los favoritos con la base de datos o el almacenamiento local según corresponda.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [items, dispatch] = useReducer(favoritesReducer, [], readFavoritesFromStorage);
  const isInitializing = useRef(true);

  useEffect(() => {
    let ignore = false;

    const loadFavorites = async () => {
      if (!user) {
        dispatch({ type: "set", payload: { items: readFavoritesFromStorage() } });
        isInitializing.current = false;
        return;
      }

      try {
        const userFavorites = await getUserFavorites(user.uid);
        if (!ignore) {
          dispatch({ type: "set", payload: { items: userFavorites } });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          isInitializing.current = false;
        }
      }
    };

    void loadFavorites();

    return () => {
      ignore = true;
    };
  }, [user?.uid]);
// Establece un efecto que se ejecuta cuando cambian los elementos favoritos, el uid del usuario o el estado de carga. Si hay un usuario autenticado y no se está cargando, sincroniza los favoritos del usuario con la base de datos. Si no hay un usuario, escribe los favoritos en el almacenamiento local.
  useEffect(() => {
    if (user && !loading && !isInitializing.current) {
      void syncUserFavorites(user.uid, items).catch((error) => {
        console.error("Error sincronizando favoritos:", error);
      });
      return;
    }

    writeFavoritesToStorage(items);
  }, [items, user?.uid, loading]);

  const toggleFavorite = (product: Product) => {
    dispatch({ type: "toggle", payload: { product } });
  };

  const removeFavorite = (productId: string) => {
    dispatch({ type: "remove", payload: { productId } });
  };

  const clearFavorites = () => {
    dispatch({ type: "clear" });
  };

  const count = items.length;

  const isFavorite = (productId: string) => items.some((item) => item.id === productId);
// Devuelve el proveedor de contexto de favoritos con los valores y funciones correspondientes.
  return (
    <FavoritesContext.Provider
      value={{ items, count, isFavorite, toggleFavorite, removeFavorite, clearFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
//Establece un hook useFavorites que permite acceder al contexto de favoritos desde cualquier componente hijo. Si el hook se usa fuera del proveedor, lanza un error.
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}

export default FavoritesContext;
