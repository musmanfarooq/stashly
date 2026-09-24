import { Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./config";
import type { AppUser } from "@/types/user";

const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

interface UserDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  lastLoginAt: Timestamp;
  createdAt: Timestamp;
}

function toAppUser(data: UserDoc): AppUser {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    isAdmin: data.isAdmin,
    lastLoginAt: data.lastLoginAt.toMillis(),
    createdAt: data.createdAt.toMillis(),
  };
}

function baseFields(user: User) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function isSessionExpired(lastLoginAt: number): boolean {
  return Date.now() - lastLoginAt > SESSION_MAX_AGE_MS;
}

/** Explicit sign-in: creates the doc if missing, otherwise refreshes lastLoginAt to now. */
export async function recordSignIn(user: User): Promise<AppUser> {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  const now = Timestamp.now();

  const data: UserDoc = snapshot.exists()
    ? { ...(snapshot.data() as UserDoc), ...baseFields(user), lastLoginAt: now }
    : { ...baseFields(user), isAdmin: false, lastLoginAt: now, createdAt: now };

  await setDoc(ref, data, { merge: true });
  return toAppUser(data);
}

/** Passive session restore (page load): reads the doc without resetting lastLoginAt. */
export async function loadUserDoc(user: User): Promise<AppUser> {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return recordSignIn(user);
  }

  return toAppUser(snapshot.data() as UserDoc);
}
