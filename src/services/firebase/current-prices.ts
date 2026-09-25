import { Timestamp, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./config";
import type { AssetClass } from "@/types/transaction";
import type { CurrentPrice } from "@/types/current-price";

interface CurrentPriceDoc {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  updatedAt: Timestamp;
  updatedBy: string;
}

function toCurrentPrice(id: string, data: CurrentPriceDoc): CurrentPrice {
  return {
    id,
    symbol: data.symbol,
    assetClass: data.assetClass,
    price: data.price,
    updatedAt: data.updatedAt.toMillis(),
    updatedBy: data.updatedBy,
  };
}

function priceDocId(assetClass: AssetClass, symbol: string): string {
  return `${assetClass}_${symbol}`;
}

/** Global, shared across all users (2.10) — readable by anyone signed in. */
export async function fetchCurrentPrices(): Promise<CurrentPrice[]> {
  const snapshot = await getDocs(collection(db, "currentPrices"));
  return snapshot.docs.map((d) => toCurrentPrice(d.id, d.data() as CurrentPriceDoc));
}

export interface SetCurrentPriceInput {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  updatedBy: string;
}

/** Admin-only write, enforced by the `currentPrices` security rule. */
export async function setCurrentPrice(input: SetCurrentPriceInput): Promise<void> {
  if (!(input.price > 0)) {
    throw new Error("Price must be greater than 0.");
  }
  const symbol = input.symbol.trim().toUpperCase();
  if (!symbol) {
    throw new Error("Symbol is required.");
  }

  const ref = doc(db, "currentPrices", priceDocId(input.assetClass, symbol));
  await setDoc(ref, {
    symbol,
    assetClass: input.assetClass,
    price: input.price,
    updatedAt: serverTimestamp(),
    updatedBy: input.updatedBy,
  });
}
