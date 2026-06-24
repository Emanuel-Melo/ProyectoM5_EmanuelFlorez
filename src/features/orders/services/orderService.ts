import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../../shared/services/firebase/auth";
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
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Debes iniciar sesión para crear una orden.");
  }

  const idToken = await currentUser.getIdToken(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  const endpoint = `${apiBaseUrl || ""}/api/create-order`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(order),
  });

  const bodyText = await response.text();
  let parsedBody: unknown;
  try {
    parsedBody = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    const errorMessage =
      parsedBody && typeof parsedBody === "object" && parsedBody !== null && "error" in parsedBody
        ? String((parsedBody as Record<string, unknown>).error)
        : bodyText || `Error al crear la orden. Código ${response.status}`;
    throw new Error(errorMessage);
  }

  if (
    !parsedBody ||
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    typeof (parsedBody as Record<string, unknown>).orderId !== "string"
  ) {
    throw new Error("No se pudo crear la orden.");
  }

  return String((parsedBody as Record<string, unknown>).orderId);
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
