import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "../../../shared/services/firebase/auth";
import type { UserProfile } from "../types/auth.types";
import { userService } from "../services/userService";
import { AuthContext } from "./authContextValue";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await userService.getUserProfile(firebaseUser.uid);

        if (isActive) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error(error);

        if (isActive) {
          setProfile(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
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
