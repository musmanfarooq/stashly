import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./config";
import type { Dividend } from "@/types/dividend";

interface DividendDoc {
  userId: string;
  symbol: string;
  amount: number;
  date: string;
  createdAt: Timestamp;
}

function toDividend(id: string, data: DividendDoc): Dividend {
  return {
    id,
    userId: data.userId,
    symbol: data.symbol,
    amount: data.amount,
    date: data.date,
    createdAt: data.createdAt.toMillis(),
  };
}

export async function fetchDividends(userId: string): Promise<Dividend[]> {
  const ref = collection(db, "dividends");
  const q = query(ref, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => toDividend(d.id, d.data() as DividendDoc))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface AddDividendInput {
  userId: string;
  symbol: string;
  amount: number;
  date: string;
}

/** Dividend records are permanently locked once created — no edit/delete, per 2.11 and the `dividends` security rule. */
export async function addDividend(input: AddDividendInput): Promise<Dividend> {
  if (!(input.amount > 0)) {
    throw new Error("Amount must be greater than 0.");
  }
  if (!input.symbol.trim()) {
    throw new Error("Symbol is required.");
  }

  const ref = collection(db, "dividends");
  const docData = {
    userId: input.userId,
    symbol: input.symbol,
    amount: input.amount,
    date: input.date,
    createdAt: serverTimestamp(),
  };
  const created = await addDoc(ref, docData);

  return {
    id: created.id,
    userId: input.userId,
    symbol: input.symbol,
    amount: input.amount,
    date: input.date,
    createdAt: Date.now(),
  };
}
