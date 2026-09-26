"use client";

import { useGetLiveCryptoPricesQuery } from "@/store/api/livePricesApi";

const POLL_INTERVAL_MS = 60_000;

/**
 * Polls live USD prices for the given crypto symbols once a minute. Only
 * call this from the two places prices should actually refresh (Dashboard,
 * Crypto page) — everywhere else should just read the same cached RTK Query
 * result (e.g. via useGetLiveCryptoPricesQuery directly, no poll) so it
 * shows the latest fetch without triggering a call itself.
 */
export function useLiveCryptoPrices(symbols: string[]) {
  const sorted = [...symbols].sort();
  const { data, isLoading, isError } = useGetLiveCryptoPricesQuery(sorted, {
    pollingInterval: POLL_INTERVAL_MS,
    skip: sorted.length === 0,
  });

  return { livePrices: data ?? {}, isLoading, isError };
}
