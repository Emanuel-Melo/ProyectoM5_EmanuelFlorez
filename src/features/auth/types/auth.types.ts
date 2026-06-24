import type { User } from "firebase/auth";

export type UserRole = "admin" | "customer";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
  pendingNotification?: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
}
