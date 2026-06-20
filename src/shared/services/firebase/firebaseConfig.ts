import { getApps, initializeApp } from "firebase/app";

const getRequiredEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Falta configurar ${key} en el archivo .env`);
  }

  return value;
};

const firebaseConfig = {
  apiKey: getRequiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getRequiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredEnv("VITE_FIREBASE_APP_ID"),
};

if (!firebaseConfig.apiKey.startsWith("AIza")) {
  throw new Error(
    "VITE_FIREBASE_API_KEY no tiene el formato esperado de una API key web de Firebase"
  );
}

export const app = getApps()[0] ?? initializeApp(firebaseConfig);
