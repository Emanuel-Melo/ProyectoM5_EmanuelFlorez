import { createContext } from "react";

import type { AuthContextType } from "../types/auth.types";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
});
