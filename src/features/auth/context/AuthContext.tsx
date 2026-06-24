import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";

import { auth } from "../../../shared/services/firebase/auth";
import { db } from "../../../shared/services/firebase/firestore";
import type { UserProfile } from "../types/auth.types";
import { userService } from "../services/userService";
import { AuthContext } from "./authContextValue";

interface Props {
  children: ReactNode;
}

const isUserRole = (value: unknown): value is "admin" | "customer" =>
  value === "admin" || value === "customer";

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (!firebaseUser) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const email = firebaseUser.email ?? "";
        await userService.ensureUserProfile(firebaseUser.uid, email);

        if (!isActive) {
          return;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            if (!isActive) {
              return;
            }

            if (!snapshot.exists()) {
              setProfile(null);
              setLoading(false);
              return;
            }

            const data = snapshot.data();
            setProfile({
              uid: firebaseUser.uid,
              email: String(data.email ?? email),
              role: isUserRole(data.role) ? data.role : "customer",
              createdAt: data.createdAt,
              pendingNotification:
                typeof data.pendingNotification === "string"
                  ? data.pendingNotification
                  : null,
            });
            setLoading(false);
          },
          (error) => {
            console.error(error);
            if (isActive) {
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error(error);

        if (isActive) {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
