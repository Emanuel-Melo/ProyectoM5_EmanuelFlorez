import { createContext } from "react";

import type { AuthContextType } from "../types/auth.types";

// Contexto de autenticación que se utiliza para compartir el estado de autenticación del usuario en toda la aplicación
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
});
