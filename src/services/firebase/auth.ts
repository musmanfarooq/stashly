import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

/**
 * Set synchronously right before an explicit Google sign-in and consumed by
 * the onAuthStateChanged listener, so a fresh interactive sign-in always
 * refreshes lastLoginAt while a passive session restore (page load) never
 * does — that distinction is what makes the 14-day expiry (2.1) meaningful.
 */
let explicitSignInInProgress = false;

export async function signInWithGoogle() {
  explicitSignInInProgress = true;
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    explicitSignInInProgress = false;
    throw error;
  }
}

export function consumeExplicitSignInFlag(): boolean {
  const wasExplicit = explicitSignInInProgress;
  explicitSignInInProgress = false;
  return wasExplicit;
}

export function signOutUser() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
