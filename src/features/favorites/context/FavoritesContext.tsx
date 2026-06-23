import { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import type { Product } from "../../products/types/product.types";

export type FavoriteItem = Product;

type FavoritesContextValue = {
  items: FavoriteItem[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

type FavoritesAction =
  | { type: "toggle"; payload: { product: Product } }
  | { type: "remove"; payload: { productId: string } }
  | { type: "clear" };

const FAVORITES_KEY = "favorite_items_v1";

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function readFavoritesFromStorage(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}

function writeFavoritesToStorage(items: FavoriteItem[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}

function favoritesReducer(state: FavoriteItem[], action: FavoritesAction): FavoriteItem[] {
  switch (action.type) {
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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(favoritesReducer, [], readFavoritesFromStorage);

  useEffect(() => {
    writeFavoritesToStorage(items);
  }, [items]);

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

  return (
    <FavoritesContext.Provider
      value={{ items, count, isFavorite, toggleFavorite, removeFavorite, clearFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}

export default FavoritesContext;
