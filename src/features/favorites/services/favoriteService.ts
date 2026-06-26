import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { FavoriteItem } from "../context/FavoritesContext";

export async function getUserFavorites(uid: string): Promise<FavoriteItem[]> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
// Si el documento del usuario no existe, devuelve un arreglo vacío. De lo contrario, obtiene los ids de los favoritos del usuario y los mapea a objetos FavoriteItem obteniendo los datos de cada producto desde la base de datos. Filtra los elementos nulos antes de devolver el arreglo final.
  if (!userSnap.exists()) {
    return [];
  }

  const data = userSnap.data();
  const favoriteIds = Array.isArray(data.favorites)
    ? data.favorites.filter((id) => typeof id === "string") as string[]
    : [];
// Mapea los ids de los favoritos a objetos FavoriteItem obteniendo los datos de cada producto desde la base de datos. Filtra los elementos nulos antes de devolver el arreglo final.
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
// Establece una función syncUserFavorites que toma un uid de usuario y un arreglo de FavoriteItem, y sincroniza los favoritos del usuario en la base de datos. La función actualiza o crea el documento del usuario con los ids de los favoritos.
export async function syncUserFavorites(uid: string, favorites: FavoriteItem[]): Promise<void> {
  const userRef = doc(db, "users", uid);
  const payload = favorites.map((item) => item.id);
// Aquí se obtiene el documento del usuario y se actualiza o crea con los ids de los favoritos. Si el documento del usuario existe, se actualiza con los nuevos favoritos; si no, se crea un nuevo documento con los favoritos.
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { favorites: payload });
  } else {
    await setDoc(userRef, { favorites: payload });
  }
}
