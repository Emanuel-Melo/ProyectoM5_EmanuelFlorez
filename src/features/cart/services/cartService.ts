import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { CartItem } from "../context/CartContext";

type CartPayloadItem = {
  id: string;
  quantity: number;
};

function mapCartItem(id: string, quantity: number, data: Record<string, unknown>): CartItem {
  return {
    id,
    name: String(data.name ?? "Producto sin nombre"),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    category: String(data.category ?? "otros"),
    imageUrl: String(data.imageUrl ?? ""),
    active: data.active === undefined ? true : Boolean(data.active),
    quantity,
  };
}

export async function getUserCart(uid: string): Promise<CartItem[]> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const data = userSnap.data();
  const cartPayload = Array.isArray(data.cart) ? (data.cart as CartPayloadItem[]) : [];

  const hydratedItems = await Promise.all(
    cartPayload.map(async (item) => {
      if (typeof item?.id !== "string" || typeof item?.quantity !== "number") {
        return null;
      }

      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        return null;
      }

      const productData = productSnap.data();
      return mapCartItem(item.id, item.quantity, productData);
    })
  );

  return hydratedItems.filter((item): item is CartItem => item !== null);
}

export async function syncUserCart(uid: string, cart: CartItem[]): Promise<void> {
  const userRef = doc(db, "users", uid);
  const payload: CartPayloadItem[] = cart.map((item) => ({
    id: item.id,
    quantity: item.quantity,
  }));

  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { cart: payload });
  } else {
    await setDoc(userRef, { cart: payload });
  }
}
