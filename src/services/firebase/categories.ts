import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { Category } from "@/types/category";

const DEFAULT_CATEGORIES = ["Oil", "IT", "Banks"];

interface CategoryDoc {
  userId?: string;
  createdBy?: string;
  name: string;
  createdAt: Timestamp;
}

function toCategory(id: string, data: CategoryDoc): Category {
  return {
    id,
    name: data.name,
    createdBy: data.createdBy ?? data.userId ?? "unknown",
    createdAt: data.createdAt.toMillis(),
  };
}

function byName(a: Category, b: Category): number {
  return a.name.localeCompare(b.name);
}

/** Global types (2.5) — shared across every user, admin-managed. Seeded once if the collection is ever completely empty. */
export async function fetchCategories(): Promise<Category[]> {
  const categoriesRef = collection(db, "types");
  const snapshot = await getDocs(categoriesRef);

  if (snapshot.empty) {
    return seedDefaultCategories();
  }

  return snapshot.docs.map((d) => toCategory(d.id, d.data() as CategoryDoc)).sort(byName);
}

async function seedDefaultCategories(): Promise<Category[]> {
  const categoriesRef = collection(db, "types");
  const batch = writeBatch(db);
  const now = Timestamp.now();
  const seeded: Category[] = [];

  for (const name of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesRef);
    batch.set(ref, { name, createdBy: "system", createdAt: now });
    seeded.push({ id: ref.id, name, createdBy: "system", createdAt: now.toMillis() });
  }

  await batch.commit();
  return seeded.sort(byName);
}

/** Admin-only, enforced by the `types` security rule. */
export async function addCategory(createdBy: string, name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Category name is required.");
  }

  const existing = await fetchCategories();
  if (existing.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`"${trimmed}" already exists.`);
  }

  const categoriesRef = collection(db, "types");
  const docRef = await addDoc(categoriesRef, {
    name: trimmed,
    createdBy,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, name: trimmed, createdBy, createdAt: Date.now() };
}

/**
 * One-time migration from the old per-user `types` model (every user had
 * their own private copy, seeded from the same 3 defaults plus whatever
 * they personally added) to the new global model. Reads every doc in the
 * collection regardless of owner, collapses duplicates by
 * case-insensitive name, writes one clean global doc per distinct name,
 * then deletes all the old per-user docs. Safe to run more than once —
 * a second run just finds the already-consolidated set and does nothing.
 * Admin-only, enforced by the `types` security rule (requires the global
 * read/write rule to already be deployed before running).
 */
export async function migrateCategoriesToGlobal(adminUid: string): Promise<{ kept: number; removed: number }> {
  const categoriesRef = collection(db, "types");
  const snapshot = await getDocs(categoriesRef);

  const byNameLower = new Map<string, CategoryDoc & { id: string }>();
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as CategoryDoc;
    const key = data.name.trim().toLowerCase();
    if (!byNameLower.has(key)) {
      byNameLower.set(key, { id: docSnap.id, ...data });
    }
  }

  const batch = writeBatch(db);
  const now = Timestamp.now();
  let kept = 0;

  for (const entry of byNameLower.values()) {
    const ref = doc(categoriesRef);
    batch.set(ref, {
      name: entry.name.trim(),
      createdBy: entry.createdBy ?? entry.userId ?? adminUid,
      createdAt: entry.createdAt ?? now,
    });
    kept += 1;
  }

  let removed = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(doc(db, "types", docSnap.id));
    removed += 1;
  }

  await batch.commit();
  return { kept, removed };
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "types", id));
}
