"use client";

import {
  computeActivePositions,
  computePricedPositions,
  mergeLiveCryptoPrices,
  type PricedPosition,
} from "@/lib/portfolio-stats";
import type { CurrentPrice } from "@/types/current-price";
import type { AssetClass, Transaction } from "@/types/transaction";
import { useLiveCryptoPrices } from "./use-live-crypto-prices";

/**
 * Stocks: priced from the admin-set currentPrices doc, unchanged.
 * Crypto: priced from the live 60s-polled feed, falling back to the
 * admin-set price only where the live feed has nothing for that symbol.
 */
export function usePricedPositions(
  transactions: Transaction[],
  assetClass: AssetClass,
  adminPrices: CurrentPrice[],
): PricedPosition[] {
  const positions = computeActivePositions(transactions);
  const cryptoSymbols = assetClass === "crypto" ? positions.map((position) => position.symbol) : [];
  const { livePrices } = useLiveCryptoPrices(cryptoSymbols);

  const effectivePrices =
    assetClass === "crypto" ? mergeLiveCryptoPrices(adminPrices, livePrices) : adminPrices;

  return computePricedPositions(transactions, effectivePrices);
}
