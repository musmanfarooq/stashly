import { collection, doc, documentId, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "./config";

/**
 * Cached ticker-symbol -> CoinGecko coin-id resolutions, global and shared
 * across all users — a symbol only ever needs resolving once, the first
 * time anyone adds it, rather than on every user's every session.
 */
export async function fetchCachedCoinIds(symbols: string[]): Promise<Record<string, string>> {
  if (symbols.length === 0) return {};

  const ref = collection(db, "cryptoSymbolMap");
  const q = query(ref, where(documentId(), "in", symbols));
  const snapshot = await getDocs(q);

  const result: Record<string, string> = {};
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as { coingeckoId: string };
    result[docSnap.id] = data.coingeckoId;
  }
  return result;
}

export async function cacheCoinId(symbol: string, coingeckoId: string): Promise<void> {
  await setDoc(doc(db, "cryptoSymbolMap", symbol), { symbol, coingeckoId });
}
