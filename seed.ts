import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getApps, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

type Product = Record<string, unknown> & {
  id?: string | number;
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const loadEnvFile = () => {
  const envPath = resolve(".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    process.env[key] ??= value;
  }
};

const getRequiredEnv = (key: (typeof requiredEnvKeys)[number]) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Falta configurar ${key} en el archivo .env`);
  }

  return value;
};

const readProducts = () => {
  const productsPath = resolve("products.json");

  if (!existsSync(productsPath)) {
    throw new Error("No se encontro products.json en la raiz del proyecto.");
  }

  const fileContent = readFileSync(productsPath, "utf8").trim();

  if (!fileContent) {
    throw new Error("products.json esta vacio. Agrega un arreglo de productos.");
  }

  const products = JSON.parse(fileContent) as unknown;

  if (!Array.isArray(products)) {
    throw new Error("products.json debe contener un arreglo de productos.");
  }

  return products as Product[];
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const seedProducts = async () => {
  loadEnvFile();

  const firebaseConfig = {
    apiKey: getRequiredEnv("VITE_FIREBASE_API_KEY"),
    authDomain: getRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getRequiredEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getRequiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getRequiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getRequiredEnv("VITE_FIREBASE_APP_ID"),
  };

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const products = readProducts();
  const productsCollection = collection(db, "products");
  let uploadedCount = 0;

  for (const productsChunk of chunk(products, 500)) {
    const batch = writeBatch(db);

    for (const product of productsChunk) {
      if (!product || typeof product !== "object" || Array.isArray(product)) {
        throw new Error("Cada producto debe ser un objeto JSON valido.");
      }

      const productRef =
        product.id === undefined || product.id === null
          ? doc(productsCollection)
          : doc(productsCollection, String(product.id));

      batch.set(
        productRef,
        {
          ...product,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    uploadedCount += productsChunk.length;
  }

  console.log(`${uploadedCount} productos subidos a Firestore.`);
};

seedProducts().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
