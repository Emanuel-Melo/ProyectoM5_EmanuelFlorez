//Este archivo sirve para tener codigo limpio de main, ayuda a escalabilidad
import type { ReactNode } from "react";

import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "../../features/cart/context/CartContext";
import { FavoritesProvider } from "../../features/favorites/context/FavoritesContext";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>{children}</CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}