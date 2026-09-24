import type { Transaction } from "@/types/transaction";

function activeBuyLots(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.action === "buy" && t.remainingShares > 0);
}

/** Cost basis still tied up in currently open holdings (2.4). */
export function computeTotalInvested(transactions: Transaction[]): number {
  return activeBuyLots(transactions).reduce((sum, lot) => sum + lot.remainingShares * lot.price, 0);
}

/** Total realized profit/loss from all sold positions (2.4). */
export function computeTotalRealizedPL(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.action === "sell")
    .reduce((sum, t) => sum + (t.realizedPL ?? 0), 0);
}

/** Distinct symbols currently held (appear in the Active tab of Holdings). */
export function computeActiveSymbolCount(transactions: Transaction[]): number {
  const symbols = new Set(activeBuyLots(transactions).map((t) => t.symbol));
  return symbols.size;
}

/** Distinct symbols with at least one sale recorded (appear in the Sold tab of Holdings). */
export function computeSoldSymbolCount(transactions: Transaction[]): number {
  const symbols = new Set(transactions.filter((t) => t.action === "sell").map((t) => t.symbol));
  return symbols.size;
}

export interface CategoryAllocation {
  category: string;
  value: number;
}

/** Cost basis of currently open holdings, grouped by type/category (2.6). */
export function computeAllocationByCategory(transactions: Transaction[]): CategoryAllocation[] {
  const totals = new Map<string, number>();

  for (const lot of activeBuyLots(transactions)) {
    const current = totals.get(lot.category) ?? 0;
    totals.set(lot.category, current + lot.remainingShares * lot.price);
  }

  return Array.from(totals.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}
