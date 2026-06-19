export type UserRole = "admin" | "customer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}