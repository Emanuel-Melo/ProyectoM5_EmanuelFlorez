import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../../../shared/services/firebase/auth";

const googleProvider = new GoogleAuthProvider();

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