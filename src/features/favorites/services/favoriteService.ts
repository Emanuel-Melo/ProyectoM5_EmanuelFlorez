import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { FavoriteItem } from "../context/FavoritesContext";

export async function getUserFavorites(uid: string): Promise<FavoriteItem[]> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const data = userSnap.data();
  return Array.isArray(data.favorites) ? (data.favorites as FavoriteItem[]) : [];
}

export async function syncUserFavorites(uid: string, favorites: FavoriteItem[]): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { favorites }, { merge: true });
}
