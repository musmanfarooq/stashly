"use client";

import { computeActivePositions, computePricedPositions, type PricedPosition } from "@/lib/portfolio-stats";
import type { AssetClass, Transaction } from "@/types/transaction";
import { useLiveCryptoPrices } from "./use-live-crypto-prices";
import { useLivePsxPrices } from "./use-live-psx-prices";

/** Prices come from the relevant live feed — PSX market-summary for stocks, CoinGecko for crypto. */
export function usePricedPositions(transactions: Transaction[], assetClass: AssetClass): PricedPosition[] {
  const positions = computeActivePositions(transactions);
  const symbols = positions.map((position) => position.symbol);

  // Both hooks are called unconditionally (Rules of Hooks); each internally
  // skips its fetch when handed an empty symbol list.
  const { livePrices: liveStockPrices } = useLivePsxPrices(assetClass === "stock" ? symbols : []);
  const { livePrices: liveCryptoPrices } = useLiveCryptoPrices(assetClass === "crypto" ? symbols : []);

  const livePrices = assetClass === "stock" ? liveStockPrices : liveCryptoPrices;

  return computePricedPositions(transactions, livePrices);
}
