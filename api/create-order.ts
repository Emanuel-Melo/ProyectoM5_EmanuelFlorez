import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore, type Transaction } from "firebase-admin/firestore";

// Esta función es para buscar credenciales de Firebase Admin en diferentes entornos (producción, desarrollo local, etc.)
const getServiceAccountCredential = () => {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  // Si existe GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return applicationDefault();
  }

  // Desarrollo local: usar serviceAccountKey.json
  const serviceAccountPath =
    process.env.SERVICE_ACCOUNT_KEY_PATH?.trim() ||
    "serviceAccountKey.json";

  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      readFileSync(resolve(serviceAccountPath), "utf8")
    );

    return cert(serviceAccount);
  }

  throw new Error(
    "Firebase Admin no está configurado. Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en producción o usa serviceAccountKey.json en desarrollo."
  );
};

//Reutiliza procesos de vercel para evitar inicializar la app de Firebase Admin más de una vez
if (!getApps().length) {
  initializeApp({
    credential: getServiceAccountCredential(),
  });
}

//Evita errores cuando un campo es undefined
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const jsonResponse = (res: any, status: number, payload: unknown) => {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.json(payload);
};

export default async function createOrderHandler(req: { method: string; body: unknown; headers?: Record<string, string | string[] | undefined> }, res: any) {
  if (req.method !== "POST") {
    return jsonResponse(res, 405, { error: "Método no permitido" });
  } //Solo acepta valores POST porque crar una orden es una acción que modifica el estado del servidor y no debería ser accesible mediante GET u otros métodos.

  const authHeader = req.headers?.authorization;
  const bearerToken = typeof authHeader === "string" ? authHeader.split(" ") : [];
  const idToken = bearerToken.length === 2 && bearerToken[0] === "Bearer" ? bearerToken[1] : null;

  if (!idToken) {
    return jsonResponse(res, 401, { error: "No autorizado: falta token." });
  }

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    return jsonResponse(res, 401, { error: "Token inválido." });
  }// Verifica que el token sea válido y decodifícalo para obtener información del usuario, lo que colabora como una seguridad más robusta

  const body = req.body as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId : null;
  const items = Array.isArray(body.items) ? body.items : null;
  const shipping = typeof body.shipping === "string" ? body.shipping : "Gratis";

  if (!userId || decodedToken.uid !== userId) {
    return jsonResponse(res, 403, { error: "Usuario no autorizado para crear esta orden." });
  }

  if (!items || items.length === 0) {
    return jsonResponse(res, 400, { error: "La orden debe contener al menos un producto." });
  }

  const orderItems: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    imageUrl: string;
    active: boolean;
    quantity: number;
    discountPercent?: number;
  }> = [];

  try {
    const productRefs = items.map((item: any) => ({
      id: String(item.id ?? ""),
      quantity: Number(item.quantity ?? 0),
      ref: db.doc(`products/${String(item.id ?? "")}`),
    }));

    for (const product of productRefs) {
      if (!product.id || product.quantity <= 0 || product.quantity > 3) {
        return jsonResponse(res, 400, { error: "Cada producto debe tener id válido y cantidad entre 1 y 3." });
      }
    }

    const orderRef = db.collection("orders").doc();
    const userRef = db.doc(`users/${userId}`);

//Esta función soluciona el problema de doble pedido simultaneo ya que válida hasta que solo una orden gane
    await db.runTransaction(async (transaction: Transaction) => {
      const productSnaps = await Promise.all(productRefs.map((product) => transaction.get(product.ref)));
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error("Perfil de usuario no encontrado.");
      }

      let subtotal = 0;
      orderItems.length = 0;

      for (let index = 0; index < productRefs.length; index += 1) {
        const product = productRefs[index];
        const snapshot = productSnaps[index];

        if (!snapshot.exists) {
          throw new Error(`El producto ${product.id} no está disponible.`);
        }

        const data = snapshot.data() ?? {};
        const currentStock = Number(data.stock ?? 0);

        if (currentStock < product.quantity) {
          throw new Error(`Stock insuficiente para ${String(data.name ?? product.id)}. Solo quedan ${currentStock} unidades.`);
        }

        const price = Number(data.price ?? 0);
        const discountPercent = typeof data.discountPercent === "number" ? data.discountPercent : 0;
        const discountedPrice = discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price; //Adicional calcula descuentos segun precio, busca datos directamente de firestore

        const itemData: any = {
          id: product.id,
          name: String(data.name ?? "Producto"),
          description: String(data.description ?? ""),
          price,
          stock: currentStock,
          category: String(data.category ?? "otros"),
          imageUrl: String(data.imageUrl ?? ""),
          active: Boolean(data.active ?? true),
          quantity: product.quantity,
        };

        // Solo agregar discountPercent si es mayor a 0
        if (discountPercent > 0) {
          itemData.discountPercent = discountPercent;
        }

        orderItems.push(itemData);

        subtotal += discountedPrice * product.quantity;
      }

      const orderPayload = {
        userId,
        items: orderItems,
        total: subtotal,
        discount: Number(body.discount ?? 0),
        shipping,
        status: "processing",
          createdAt: FieldValue.serverTimestamp(),
      }

//Aquí evita vaciar carrito si ocurre error en la transacción
      transaction.set(orderRef, orderPayload);
      transaction.update(userRef, { cart: [] });
    });

    return jsonResponse(res, 200, { orderId: orderRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear la orden.";
    return jsonResponse(res, 400, { error: message });
  }
}
