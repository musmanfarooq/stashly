import { fetchLivePrices, searchCoinId } from "@/services/coingecko";
import { cacheCoinId, fetchCachedCoinIds } from "@/services/firebase/crypto-symbol-map";
import { baseApi } from "./baseApi";

/**
 * The Firestore cache is a pure optimization (avoids re-resolving the same
 * symbol via CoinGecko search every poll) — never a hard dependency. If
 * Firestore is unreachable for any reason (rules not yet deployed, network
 * hiccup), resolution still proceeds via CoinGecko directly, just without
 * the cache's benefit that round.
 */
async function readCache(symbols: string[]): Promise<Record<string, string>> {
  try {
    return await fetchCachedCoinIds(symbols);
  } catch {
    return {};
  }
}

async function writeCache(symbol: string, coingeckoId: string): Promise<void> {
  try {
    await cacheCoinId(symbol, coingeckoId);
  } catch {
    // Best-effort only — a failed cache write just means this symbol gets
    // re-resolved via search next time, not a reason to fail the fetch.
  }
}

async function resolveCoinIds(symbols: string[]): Promise<Record<string, string>> {
  const cached = await readCache(symbols);
  const missing = symbols.filter((symbol) => !cached[symbol]);

  const resolved = { ...cached };
  for (const symbol of missing) {
    const id = await searchCoinId(symbol);
    if (id) {
      resolved[symbol] = id;
      await writeCache(symbol, id);
    }
  }
  return resolved;
}

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const livePricesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** symbols must be pre-sorted by the caller for a stable cache key. */
    getLiveCryptoPrices: builder.query<Record<string, number>, string[]>({
      queryFn: async (symbols) => {
        if (symbols.length === 0) return { data: {} };

        try {
          const coinIdBySymbol = await resolveCoinIds(symbols);
          const uniqueIds = Array.from(new Set(Object.values(coinIdBySymbol)));
          const pricesByCoinId = await fetchLivePrices(uniqueIds);

          const pricesBySymbol: Record<string, number> = {};
          for (const symbol of symbols) {
            const coinId = coinIdBySymbol[symbol];
            const price = coinId ? pricesByCoinId[coinId] : undefined;
            if (price !== undefined) {
              pricesBySymbol[symbol] = price;
            }
          }
          return { data: pricesBySymbol };
        } catch (error) {
          return toQueryError(error);
        }
      },
    }),
  }),
});

export const { useGetLiveCryptoPricesQuery } = livePricesApi;
