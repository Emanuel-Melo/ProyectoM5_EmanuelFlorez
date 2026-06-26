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
// Define un objeto que mapea los códigos de error de Firebase a mensajes de error más amigables para el usuario. Esto permite mostrar mensajes de error claros y comprensibles en la interfaz de usuario cuando ocurren errores durante la autenticación.
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
  "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexion.",
  "auth/popup-blocked": "El navegador bloqueo la ventana de Google.",
  "auth/popup-closed-by-user": "La ventana de Google se cerro antes de iniciar sesion.",
  "auth/user-disabled": "Este usuario esta deshabilitado.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
};
// Define una función que toma un error desconocido como argumento y devuelve un mensaje de error amigable para el usuario. La función verifica si el error es un error de Firebase y si tiene un código de error conocido, en cuyo caso devuelve el mensaje correspondiente del objeto authErrorMessages. Si no, devuelve el mensaje de error genérico o un mensaje predeterminado.
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
// Define un objeto authService que contiene métodos para registrar, iniciar sesión, cerrar sesión e iniciar sesión con Google utilizando Firebase Authentication. Cada método devuelve una promesa que se resuelve con el resultado de la operación correspondiente.
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
// Define un método logout que cierra la sesión del usuario actual utilizando Firebase Authentication. Este método devuelve una promesa que se resuelve cuando la operación de cierre de sesión se completa.
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
