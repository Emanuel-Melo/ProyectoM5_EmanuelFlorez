import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { CartItem } from "../../cart/context/CartContext";

export type OrderRecord = {
  userId: string;
  items: CartItem[];
  total: number;
  discount: number;
  shipping: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  createdAt: unknown;
};

export async function createOrder(order: Omit<OrderRecord, "createdAt">): Promise<void> {
  const ordersCollection = collection(db, "orders");
  await addDoc(ordersCollection, {
    ...order,
    createdAt: serverTimestamp(),
  });
}
