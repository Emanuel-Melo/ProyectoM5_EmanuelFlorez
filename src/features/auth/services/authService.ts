import {
  createUserWithEmailAndPassword,
  type AuthError,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../../../shared/services/firebase/auth";

const googleProvider = new GoogleAuthProvider();

const authErrorMessages: Record<string, string> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "La API key configurada para Firebase no es valida. Revisa VITE_FIREBASE_API_KEY y reinicia el servidor de Vite.",
  "auth/invalid-api-key":
    "La API key configurada para Firebase no es valida. Revisa VITE_FIREBASE_API_KEY y reinicia el servidor de Vite.",
  "auth/invalid-credential": "Correo o contrasena incorrectos.",
  "auth/invalid-email": "Ingresa un correo valido.",
  "auth/missing-password": "Ingresa tu contrasena.",
  "auth/email-already-in-use": "Este correo ya esta registrado.",
  "auth/weak-password": "La contrasena debe tener minimo 6 caracteres.",
  "auth/popup-closed-by-user": "La ventana de Google se cerro antes de iniciar sesion.",
};

export const getAuthErrorMessage = (error: unknown) => {
  const firebaseError = error as Partial<AuthError>;

  if (firebaseError.code && authErrorMessages[firebaseError.code]) {
    return authErrorMessages[firebaseError.code];
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la autenticacion.";
};

export const authService = {
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  },

  login(email: string, password: string) {
    return signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  },

  logout() {
    return signOut(auth);
  },

  loginWithGoogle() {
    return signInWithPopup(
      auth,
      googleProvider
    );
  },
};
