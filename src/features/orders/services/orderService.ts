import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../../../shared/services/firebase/firestore";
import type { CartItem } from "../../cart/context/CartContext";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

const isOrderStatus = (value: unknown): value is OrderStatus =>
  value === "pending" ||
  value === "processing" ||
  value === "shipped" ||
  value === "delivered" ||
  value === "canceled";

const parseOrderStatus = (value: unknown): OrderStatus => {
  if (typeof value !== "string") {
    return "pending";
  }

  const normalized = value.trim().toLowerCase();

  if (isOrderStatus(normalized)) {
    return normalized;
  }

  if (normalized === "pendiente") return "pending";
  if (normalized === "procesando" || normalized === "en proceso") return "processing";
  if (normalized === "enviado" || normalized === "en camino") return "shipped";
  if (normalized === "entregado") return "delivered";
  if (normalized === "cancelado" || normalized === "cancelados") return "canceled";

  return "pending";
};

export type OrderRecord = {
  userId: string;
  items: CartItem[];
  total: number;
  discount: number;
  shipping: string;
  status: OrderStatus;
  createdAt: unknown;
};

export type OrderSummary = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  discount: number;
  shipping: string;
  status: OrderStatus;
  createdAt?: unknown;
};

export async function createOrder(order: Omit<OrderRecord, "createdAt">): Promise<string> {
  const ordersCollection = collection(db, "orders");
  const orderRef = await addDoc(ordersCollection, {
    ...order,
    createdAt: serverTimestamp(),
  });

  return orderRef.id;
}

export async function fetchOrderById(orderId: string): Promise<OrderSummary | null> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    return null;
  }

  const orderData = orderSnapshot.data();

  return {
    id: orderSnapshot.id,
    userId: String(orderData.userId ?? ""),
    items: Array.isArray(orderData.items) ? (orderData.items as CartItem[]) : [],
    total: Number(orderData.total ?? 0),
    discount: Number(orderData.discount ?? 0),
    shipping: String(orderData.shipping ?? ""),
    status: parseOrderStatus(orderData.status),
    createdAt: orderData.createdAt,
  };
}

export async function fetchOrdersByUser(userId: string): Promise<OrderSummary[]> {
  const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  const ordersSnapshot = await getDocs(ordersQuery);

  const orders = ordersSnapshot.docs.map((orderDoc) => {
    const orderData = orderDoc.data();

    return {
      id: orderDoc.id,
      userId: String(orderData.userId ?? ""),
      items: Array.isArray(orderData.items) ? (orderData.items as CartItem[]) : [],
      total: Number(orderData.total ?? 0),
      discount: Number(orderData.discount ?? 0),
      shipping: String(orderData.shipping ?? ""),
      status: parseOrderStatus(orderData.status),
      createdAt: orderData.createdAt,
    };
  });

  return orders.sort((a, b) => {
    const getMillis = (value: unknown) => {
      if (value && typeof value === "object" && "toMillis" in value) {
        return (value as { toMillis: () => number }).toMillis();
      }
      if (typeof value === "number") {
        return value;
      }
      return 0;
    };

    return getMillis(b.createdAt) - getMillis(a.createdAt);
  });
}
