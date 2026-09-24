import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { AssetClass, Transaction, TransactionAction } from "@/types/transaction";
import type { Holding, HoldingStatus } from "@/types/holding";

interface TransactionDoc {
  userId: string;
  assetClass: AssetClass;
  action: TransactionAction;
  symbol: string;
  name: string;
  category: string;
  shares: number;
  remainingShares: number;
  price: number;
  date: string;
  locked: boolean;
  realizedPL: number | null;
  costBasisAtSale: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toTransaction(id: string, data: TransactionDoc): Transaction {
  return {
    id,
    userId: data.userId,
    assetClass: data.assetClass,
    action: data.action,
    symbol: data.symbol,
    name: data.name,
    category: data.category,
    shares: data.shares,
    remainingShares: data.remainingShares,
    price: data.price,
    date: data.date,
    locked: data.locked,
    realizedPL: data.realizedPL,
    costBasisAtSale: data.costBasisAtSale,
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
  };
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function assertPositiveSharesAndPrice(shares: number, price: number): void {
  if (!(shares > 0) || !(price > 0)) {
    throw new Error("Shares and price must be greater than 0.");
  }
}

export async function fetchTransactions(
  userId: string,
  assetClass: AssetClass,
): Promise<Transaction[]> {
  const ref = collection(db, "transactions");
  const q = query(ref, where("userId", "==", userId), where("assetClass", "==", assetClass));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => toTransaction(d.id, d.data() as TransactionDoc))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

async function fetchTransactionsForSymbol(
  userId: string,
  assetClass: AssetClass,
  symbol: string,
): Promise<Transaction[]> {
  const all = await fetchTransactions(userId, assetClass);
  return all.filter((t) => t.symbol === symbol);
}

/**
 * Weighted average cost across every buy lot ever recorded for the symbol
 * (including fully-sold/locked ones) — average cost per share doesn't change
 * when shares are sold, only when new shares are bought (2.2).
 */
export function computeAverageCost(buyLots: Transaction[]): number {
  const totalShares = buyLots.reduce((sum, lot) => sum + lot.shares, 0);
  if (totalShares === 0) return 0;
  const totalCost = buyLots.reduce((sum, lot) => sum + lot.shares * lot.price, 0);
  return totalCost / totalShares;
}

function mostRecentLot(buyLots: Transaction[]): Transaction {
  return [...buyLots].sort((a, b) => b.createdAt - a.createdAt)[0];
}

function holdingId(userId: string, assetClass: AssetClass, symbol: string): string {
  return `${userId}_${assetClass}_${symbol}`;
}

/** Rebuilds the denormalized `holdings` summary doc from scratch off current `transactions` (3.2). */
async function rebuildHolding(userId: string, assetClass: AssetClass, symbol: string): Promise<void> {
  const symbolTransactions = await fetchTransactionsForSymbol(userId, assetClass, symbol);
  const buyLots = symbolTransactions.filter((t) => t.action === "buy");
  if (buyLots.length === 0) return;

  const sells = symbolTransactions.filter((t) => t.action === "sell");
  const totalShares = buyLots.reduce((sum, lot) => sum + lot.remainingShares, 0);
  const avgBuyPrice = computeAverageCost(buyLots);
  const latestLot = mostRecentLot(buyLots);

  const status: HoldingStatus =
    totalShares === 0 ? "sold" : sells.length > 0 ? "partially_sold" : "active";

  const data: Omit<Holding, "id" | "updatedAt"> = {
    userId,
    assetClass,
    symbol,
    name: latestLot.name,
    category: latestLot.category,
    totalShares,
    avgBuyPrice,
    status,
  };

  const ref = doc(db, "holdings", holdingId(userId, assetClass, symbol));
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export interface AddBuyInput {
  userId: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  category: string;
  shares: number;
  price: number;
  date: string;
}

export async function addBuyTransaction(input: AddBuyInput): Promise<Transaction> {
  assertPositiveSharesAndPrice(input.shares, input.price);
  if (!input.symbol.trim() || !input.name.trim()) {
    throw new Error("Symbol and name are required.");
  }

  const symbol = normalizeSymbol(input.symbol);
  const now = serverTimestamp();
  const ref = collection(db, "transactions");

  const created = await addDoc(ref, {
    userId: input.userId,
    assetClass: input.assetClass,
    action: "buy" as const,
    symbol,
    name: input.name.trim(),
    category: input.category,
    shares: input.shares,
    remainingShares: input.shares,
    price: input.price,
    date: input.date,
    locked: false,
    realizedPL: null,
    costBasisAtSale: null,
    createdAt: now,
    updatedAt: now,
  });

  await rebuildHolding(input.userId, input.assetClass, symbol);

  const snapshot = await getDoc(created);
  return toTransaction(created.id, snapshot.data() as TransactionDoc);
}

export interface EditBuyInput {
  id: string;
  userId: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  category: string;
  shares: number;
  price: number;
  date: string;
}

/** Only a lot with zero shares sold against it (remainingShares === shares) may be edited. */
export async function editBuyTransaction(input: EditBuyInput): Promise<void> {
  assertPositiveSharesAndPrice(input.shares, input.price);
  if (!input.symbol.trim() || !input.name.trim()) {
    throw new Error("Symbol and name are required.");
  }

  const ref = doc(db, "transactions", input.id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error("Transaction not found.");
  }

  const existing = snapshot.data() as TransactionDoc;
  if (existing.locked || existing.remainingShares !== existing.shares) {
    throw new Error("Only a lot with no shares sold against it can be edited.");
  }

  const symbol = normalizeSymbol(input.symbol);

  await updateDoc(ref, {
    symbol,
    name: input.name.trim(),
    category: input.category,
    shares: input.shares,
    remainingShares: input.shares,
    price: input.price,
    date: input.date,
    updatedAt: serverTimestamp(),
  });

  await rebuildHolding(input.userId, input.assetClass, existing.symbol);
  if (symbol !== existing.symbol) {
    await rebuildHolding(input.userId, input.assetClass, symbol);
  }
}

export interface SellSharesInput {
  userId: string;
  assetClass: AssetClass;
  symbol: string;
  shares: number;
  price: number;
  date: string;
}

export async function sellShares(input: SellSharesInput): Promise<Transaction> {
  assertPositiveSharesAndPrice(input.shares, input.price);

  const symbol = normalizeSymbol(input.symbol);
  const symbolTransactions = await fetchTransactionsForSymbol(input.userId, input.assetClass, symbol);
  const buyLots = symbolTransactions.filter((t) => t.action === "buy");

  const activeLots = buyLots
    .filter((t) => !t.locked && t.remainingShares > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  const totalAvailable = activeLots.reduce((sum, lot) => sum + lot.remainingShares, 0);
  if (input.shares > totalAvailable) {
    throw new Error(`Cannot sell more than the ${totalAvailable} shares currently held.`);
  }

  const avgCost = computeAverageCost(buyLots);
  const realizedPL = (input.price - avgCost) * input.shares;
  const latestLot = mostRecentLot(buyLots);

  const batch = writeBatch(db);
  let remainingToConsume = input.shares;

  // FIFO consumption across lots decides which lot(s) get locked — bookkeeping
  // only; the P/L above already uses the single blended average cost (2.2).
  for (const lot of activeLots) {
    if (remainingToConsume <= 0) break;
    const consumeFromLot = Math.min(lot.remainingShares, remainingToConsume);
    const newRemaining = lot.remainingShares - consumeFromLot;
    batch.update(doc(db, "transactions", lot.id), {
      remainingShares: newRemaining,
      locked: newRemaining === 0,
      updatedAt: serverTimestamp(),
    });
    remainingToConsume -= consumeFromLot;
  }

  const sellRef = doc(collection(db, "transactions"));
  const now = serverTimestamp();
  batch.set(sellRef, {
    userId: input.userId,
    assetClass: input.assetClass,
    action: "sell",
    symbol,
    name: latestLot.name,
    category: latestLot.category,
    shares: input.shares,
    remainingShares: 0,
    price: input.price,
    date: input.date,
    locked: true,
    realizedPL,
    costBasisAtSale: avgCost,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  await rebuildHolding(input.userId, input.assetClass, symbol);

  const snapshot = await getDoc(sellRef);
  return toTransaction(sellRef.id, snapshot.data() as TransactionDoc);
}
