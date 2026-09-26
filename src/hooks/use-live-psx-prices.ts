"use client";

import { useGetLivePsxPricesQuery } from "@/store/api/livePsxPricesApi";

const POLL_INTERVAL_MS = 60_000;

/**
 * Polls live PSX prices for the given stock symbols once a minute. Only
 * call this from the two places prices should actually refresh (Dashboard,
 * Stocks page) — mirrors useLiveCryptoPrices exactly.
 */
export function useLivePsxPrices(symbols: string[]) {
  const sorted = [...symbols].sort();
  const { data, isLoading, isError } = useGetLivePsxPricesQuery(sorted, {
    pollingInterval: POLL_INTERVAL_MS,
    skip: sorted.length === 0,
  });

  return { livePrices: data ?? {}, isLoading, isError };
}
