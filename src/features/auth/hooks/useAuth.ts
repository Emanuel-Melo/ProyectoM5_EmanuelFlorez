import { useContext } from "react";

import { AuthContext } from "../context/authContextValue";

//Sirve para exportar y reducir codigo, para que los componentes hijos puedan acceder al contexto de autenticación sin tener que importar el contexto directamente
export function useAuth() {
  return useContext(AuthContext);
}
