import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { CartItem } from "../context/CartContext";

export async function getUserCart(uid: string): Promise<CartItem[]> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const data = userSnap.data();
  return Array.isArray(data.cart) ? (data.cart as CartItem[]) : [];
}

export async function syncUserCart(uid: string, cart: CartItem[]): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { cart }, { merge: true });
}
