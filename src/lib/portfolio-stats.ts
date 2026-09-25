import { computeAverageCost } from "@/services/firebase/transactions";
import type { CurrentPrice } from "@/types/current-price";
import type { Transaction } from "@/types/transaction";

function activeBuyLots(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.action === "buy" && t.remainingShares > 0);
}

export interface Position {
  symbol: string;
  name: string;
  category: string;
  totalShares: number;
  avgCost: number;
}

/** One row per distinct symbol with active shares, aggregated across all of that symbol's buy lots (2.10). */
export function computeActivePositions(transactions: Transaction[]): Position[] {
  const buyLotsBySymbol = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (t.action !== "buy") continue;
    const lots = buyLotsBySymbol.get(t.symbol) ?? [];
    lots.push(t);
    buyLotsBySymbol.set(t.symbol, lots);
  }

  const positions: Position[] = [];
  for (const [symbol, lots] of buyLotsBySymbol) {
    const activeShares = lots.reduce((sum, lot) => sum + (lot.locked ? 0 : lot.remainingShares), 0);
    if (activeShares <= 0) continue;

    const latestLot = [...lots].sort((a, b) => b.createdAt - a.createdAt)[0];
    positions.push({
      symbol,
      name: latestLot.name,
      category: latestLot.category,
      totalShares: activeShares,
      avgCost: computeAverageCost(lots),
    });
  }

  return positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export interface EverBoughtSymbol {
  symbol: string;
  name: string;
}

/** Every distinct symbol ever bought — active or fully sold alike (2.11's dividend dropdown). */
export function computeEverBoughtSymbols(transactions: Transaction[]): EverBoughtSymbol[] {
  const latestBuyBySymbol = new Map<string, Transaction>();

  for (const t of transactions) {
    if (t.action !== "buy") continue;
    const existing = latestBuyBySymbol.get(t.symbol);
    if (!existing || t.createdAt > existing.createdAt) {
      latestBuyBySymbol.set(t.symbol, t);
    }
  }

  return Array.from(latestBuyBySymbol.values())
    .map((t) => ({ symbol: t.symbol, name: t.name }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
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

export interface PricedPosition extends Position {
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  unrealizedPL: number;
}

/**
 * Active positions that have a manually entered current price (2.10) —
 * symbols without one are excluded entirely, never treated as zero (2.4).
 */
export function computePricedPositions(
  transactions: Transaction[],
  currentPrices: CurrentPrice[],
): PricedPosition[] {
  const priceBySymbol = new Map(currentPrices.map((p) => [p.symbol, p.price]));
  const priced: PricedPosition[] = [];

  for (const position of computeActivePositions(transactions)) {
    const currentPrice = priceBySymbol.get(position.symbol);
    if (currentPrice === undefined) continue;

    const costBasis = position.totalShares * position.avgCost;
    const currentValue = position.totalShares * currentPrice;
    priced.push({
      ...position,
      currentPrice,
      costBasis,
      currentValue,
      unrealizedPL: currentValue - costBasis,
    });
  }

  return priced;
}

export function computeTotalUnrealizedPL(pricedPositions: PricedPosition[]): number {
  return pricedPositions.reduce((sum, position) => sum + position.unrealizedPL, 0);
}

/** Same idea as computeAllocationByCategory, weighted by current value instead of cost basis (2.4). */
export function computeAllocationByCurrentValue(pricedPositions: PricedPosition[]): CategoryAllocation[] {
  const totals = new Map<string, number>();

  for (const position of pricedPositions) {
    const current = totals.get(position.category) ?? 0;
    totals.set(position.category, current + position.currentValue);
  }

  return Array.from(totals.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}
