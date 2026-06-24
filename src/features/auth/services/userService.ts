import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { UserProfile, UserRole } from "../types/auth.types";

const validRoles: UserRole[] = ["admin", "customer"];

const isUserRole = (role: unknown): role is UserRole =>
  typeof role === "string" && validRoles.includes(role as UserRole);

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();

    return {
      uid: typeof data.uid === "string" ? data.uid : uid,
      email: typeof data.email === "string" ? data.email : "",
      role: isUserRole(data.role) ? data.role : "customer",
      createdAt: data.createdAt,
      pendingNotification:
        typeof data.pendingNotification === "string"
          ? data.pendingNotification
          : null,
    };
  },

  async createUserProfile(profile: {
    uid: string;
    email: string;
    role: UserRole;
  }): Promise<void> {
    const userRef = doc(db, "users", profile.uid);

    await setDoc(userRef, {
      uid: profile.uid,
      email: profile.email,
      role: profile.role,
      createdAt: serverTimestamp(),
      pendingNotification: null,
    });
  },

  async ensureUserProfile(uid: string, email: string): Promise<UserProfile> {
    const existingProfile = await this.getUserProfile(uid);

    if (existingProfile) {
      return existingProfile;
    }

    await this.createUserProfile({
      uid,
      email,
      role: "customer",
    });

    const createdProfile = await this.getUserProfile(uid);

    if (!createdProfile) {
      throw new Error("No se pudo crear el perfil de usuario.");
    }

    return createdProfile;
  },

  async setPendingNotification(
    uid: string,
    message: string | null
  ): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      pendingNotification: message,
    });
  },

  async clearPendingNotification(uid: string): Promise<void> {
    return this.setPendingNotification(uid, null);
  },
};
