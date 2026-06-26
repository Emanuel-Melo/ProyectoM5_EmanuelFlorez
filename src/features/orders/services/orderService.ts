import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../../shared/services/firebase/auth";
import { db } from "../../../shared/services/firebase/firestore";
import type { CartItem } from "../../cart/context/CartContext";
// Este tipado contiene la definición de los tipos relacionados con las órdenes de compra, incluyendo el estado de la orden, el registro de la orden y el resumen de la orden. También incluye funciones para crear una orden, obtener una orden por su ID y obtener todas las órdenes de un usuario específico.
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

const isOrderStatus = (value: unknown): value is OrderStatus =>
  value === "pending" ||
  value === "processing" ||
  value === "shipped" ||
  value === "delivered" ||
  value === "canceled";
// Esta función sirve para convertir un valor desconocido en un estado de orden válido. Si el valor no es una cadena de texto, devuelve "pending" por defecto. Si el valor es una cadena de texto, lo normaliza y verifica si coincide con alguno de los estados válidos. Si coincide, devuelve el estado correspondiente; si no, también devuelve "pending" por defecto.
const parseOrderStatus = (value: unknown): OrderStatus => {
  if (typeof value !== "string") {
    return "pending";
  }

  const normalized = value.trim().toLowerCase();

  if (isOrderStatus(normalized)) {
    return normalized;
  }
// Normaliza los valores de estado en español a sus equivalentes en inglés para mantener la consistencia en el sistema. Por ejemplo, "pendiente" se convierte en "pending", "procesando" o "en proceso" se convierten en "processing", y así sucesivamente. Si no coincide con ningún estado conocido, devuelve "pending" por defecto.
  if (normalized === "pendiente") return "pending";
  if (normalized === "procesando" || normalized === "en proceso") return "processing";
  if (normalized === "enviado" || normalized === "en camino") return "shipped";
  if (normalized === "entregado") return "delivered";
  if (normalized === "cancelado" || normalized === "cancelados") return "canceled";

  return "pending";
};
// Este tipado contiene la definición de los tipos relacionados con las órdenes de compra, incluyendo el estado de la orden, el registro de la orden y el resumen de la orden. También incluye funciones para crear una orden, obtener una orden por su ID y obtener todas las órdenes de un usuario específico.
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
// Lee la respuesta de la API y maneja los posibles errores. Si la respuesta no es exitosa, intenta extraer un mensaje de error del cuerpo de la respuesta. Si no se puede extraer un mensaje de error, utiliza un mensaje genérico que incluya el código de estado HTTP. Si la respuesta es exitosa, verifica que el cuerpo contenga un campo "orderId" válido y lo devuelve como resultado.
  const bodyText = await response.text();
  let parsedBody: unknown;
  try {
    parsedBody = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsedBody = null;
  }
// Maneja los posibles errores de la respuesta de la API. Si la respuesta no es exitosa, intenta extraer un mensaje de error del cuerpo de la respuesta. Si no se puede extraer un mensaje de error, utiliza un mensaje genérico que incluya el código de estado HTTP. Si la respuesta es exitosa, verifica que el cuerpo contenga un campo "orderId" válido y lo devuelve como resultado.
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
// Convierte los datos de la orden obtenidos de Firestore en un objeto OrderSummary, asegurándose de que los campos tengan los tipos correctos y aplicando la función parseOrderStatus para normalizar el estado de la orden.
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
// Convierte los datos de cada orden obtenidos de Firestore en un objeto OrderSummary, asegurándose de que los campos tengan los tipos correctos y aplicando la función parseOrderStatus para normalizar el estado de la orden.
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
// Ordena las órdenes por fecha de creación en orden descendente (de más reciente a más antigua). La función getMillis se utiliza para obtener la representación en milisegundos de la fecha de creación, manejando tanto objetos de fecha como valores numéricos.
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
