import type { ReactNode } from "react";

import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "../../features/cart/context/CartContext";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}