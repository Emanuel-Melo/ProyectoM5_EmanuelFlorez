import { createContext } from "react";

import type { AuthContextType } from "../types/auth.types";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});
