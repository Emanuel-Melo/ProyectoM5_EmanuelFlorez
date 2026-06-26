import type { User } from "firebase/auth";

export type UserRole = "admin" | "customer";
// Define una interfaz UserProfile que representa el perfil de un usuario en la aplicación, incluyendo su identificador único (uid), correo electrónico, rol, fecha de creación y notificación pendiente.
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
  pendingNotification?: string | null;
}
// Define una interfaz AuthContextType que representa el contexto de autenticación en la aplicación, incluyendo el usuario actual (user), su perfil (profile), su rol (role) y un indicador de carga (loading) para manejar el estado de autenticación.
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
}
