import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { FavoriteItem } from "../context/FavoritesContext";

export async function getUserFavorites(uid: string): Promise<FavoriteItem[]> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const data = userSnap.data();
  const favoriteIds = Array.isArray(data.favorites)
    ? data.favorites.filter((id) => typeof id === "string") as string[]
    : [];

  const hydratedFavorites = await Promise.all(
    favoriteIds.map(async (id) => {
      const productRef = doc(db, "products", id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        return null;
      }
      return { id, ...(productSnap.data() as Record<string, unknown>) } as FavoriteItem;
    })
  );

  return hydratedFavorites.filter((item): item is FavoriteItem => item !== null);
}

export async function syncUserFavorites(uid: string, favorites: FavoriteItem[]): Promise<void> {
  const userRef = doc(db, "users", uid);
  const payload = favorites.map((item) => item.id);

  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { favorites: payload });
  } else {
    await setDoc(userRef, { favorites: payload });
  }
}
