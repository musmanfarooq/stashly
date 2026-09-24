import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { Category } from "@/types/category";

const DEFAULT_CATEGORIES = ["Oil", "IT", "Banks"];

interface CategoryDoc {
  userId: string;
  name: string;
  createdAt: Timestamp;
}

function toCategory(id: string, data: CategoryDoc): Category {
  return { id, userId: data.userId, name: data.name, createdAt: data.createdAt.toMillis() };
}

function byName(a: Category, b: Category): number {
  return a.name.localeCompare(b.name);
}

/** Categories (2.5) are per-user; a brand-new user gets the starting list seeded on first read. */
export async function fetchCategories(userId: string): Promise<Category[]> {
  const categoriesRef = collection(db, "types");
  const q = query(categoriesRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return seedDefaultCategories(userId);
  }

  return snapshot.docs.map((d) => toCategory(d.id, d.data() as CategoryDoc)).sort(byName);
}

async function seedDefaultCategories(userId: string): Promise<Category[]> {
  const categoriesRef = collection(db, "types");
  const batch = writeBatch(db);
  const now = Timestamp.now();
  const seeded: Category[] = [];

  for (const name of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesRef);
    batch.set(ref, { userId, name, createdAt: now });
    seeded.push({ id: ref.id, userId, name, createdAt: now.toMillis() });
  }

  await batch.commit();
  return seeded.sort(byName);
}

export async function addCategory(userId: string, name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Category name is required.");
  }

  const existing = await fetchCategories(userId);
  if (existing.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`"${trimmed}" already exists.`);
  }

  const categoriesRef = collection(db, "types");
  const docRef = await addDoc(categoriesRef, {
    userId,
    name: trimmed,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, userId, name: trimmed, createdAt: Date.now() };
}
