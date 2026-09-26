"use client";

import {
  computeActivePositions,
  computePricedPositions,
  mergeLivePrices,
  type PricedPosition,
} from "@/lib/portfolio-stats";
import type { CurrentPrice } from "@/types/current-price";
import type { AssetClass, Transaction } from "@/types/transaction";
import { useLiveCryptoPrices } from "./use-live-crypto-prices";
import { useLivePsxPrices } from "./use-live-psx-prices";

/**
 * Prices from the relevant live feed (PSX via sarmaaya for stocks, CoinGecko
 * for crypto) take priority; the admin-set manual price is the fallback
 * where the live feed has nothing for that symbol.
 */
export function usePricedPositions(
  transactions: Transaction[],
  assetClass: AssetClass,
  adminPrices: CurrentPrice[],
): PricedPosition[] {
  const positions = computeActivePositions(transactions);
  const symbols = positions.map((position) => position.symbol);

  // Both hooks are called unconditionally (Rules of Hooks); each internally
  // skips its fetch when handed an empty symbol list.
  const { livePrices: liveStockPrices } = useLivePsxPrices(assetClass === "stock" ? symbols : []);
  const { livePrices: liveCryptoPrices } = useLiveCryptoPrices(assetClass === "crypto" ? symbols : []);

  const livePrices = assetClass === "stock" ? liveStockPrices : liveCryptoPrices;
  const effectivePrices = mergeLivePrices(adminPrices, livePrices, assetClass);

  return computePricedPositions(transactions, effectivePrices);
}
