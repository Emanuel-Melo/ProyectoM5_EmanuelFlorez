import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

type Product = Record<string, unknown> & {
  id?: string | number;
};

type FirebaseAdminEnvKey = "SERVICE_ACCOUNT_KEY_PATH";

const getRequiredEnv = (key: FirebaseAdminEnvKey) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Falta configurar ${key} en el archivo .env`);
  }

  return value;
};

const getProductsFilePath = () => {
  const configuredFile = process.env.PRODUCTS_FILE?.trim() || "products.json";
  return resolve(configuredFile);
};

const getServiceAccountPath = () => {
  const configuredFile = process.env.SERVICE_ACCOUNT_KEY_PATH?.trim() || "serviceAccountKey.json";
  return resolve(configuredFile);
};

const readProducts = () => {
  const productsPath = getProductsFilePath();

  if (!existsSync(productsPath)) {
    throw new Error(
      `No se encontro el archivo de productos en la ruta: ${productsPath}. ` +
        "Configura PRODUCTS_FILE en .env o coloca products.json en la raiz del proyecto."
    );
  }

  const fileContent = readFileSync(productsPath, "utf8").trim();

  if (!fileContent) {
    throw new Error("El archivo de productos esta vacio. Agrega un arreglo de productos.");
  }

  const products = JSON.parse(fileContent) as unknown;

  if (!Array.isArray(products)) {
    throw new Error("El archivo de productos debe contener un arreglo de productos.");
  }

  return products as Product[];
};

const readServiceAccount = () => {
  const keyPath = getServiceAccountPath();

  if (!existsSync(keyPath)) {
    throw new Error(`No se encontro el archivo de cuenta de servicio en: ${keyPath}`);
  }

  return JSON.parse(readFileSync(keyPath, "utf8"));
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const seedProducts = async () => {
  const serviceAccount = readServiceAccount();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const products = readProducts();
  const productsCollection = db.collection("products");
  let uploadedCount = 0;

  for (const productsChunk of chunk(products, 500)) {
    const batch = db.batch();

    for (const product of productsChunk) {
      if (!product || typeof product !== "object" || Array.isArray(product)) {
        throw new Error("Cada producto debe ser un objeto JSON valido.");
      }

      const productRef = product.id === undefined || product.id === null
        ? productsCollection.doc()
        : productsCollection.doc(String(product.id));

      batch.set(productRef, {
        ...product,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    uploadedCount += productsChunk.length;
  }

  console.log(`${uploadedCount} productos subidos a Firestore con Firebase Admin.`);
};

seedProducts().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
