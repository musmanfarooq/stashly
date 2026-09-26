/**
 * CoinGecko's free, keyless public API (docs.coingecko.com/docs/keyless-public-api).
 * No key, CORS-open — callable directly from the browser. Rate limit is
 * ~5-15 calls/min per IP, comfortably enough for one combined call/minute.
 */
const BASE_URL = "https://api.coingecko.com/api/v3";

interface CoinSearchMatch {
  id: string;
  symbol: string;
}

/** Resolves a ticker symbol (e.g. "BTC") to CoinGecko's internal coin id (e.g. "bitcoin"). */
export async function searchCoinId(symbol: string): Promise<string | null> {
  const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error("Failed to resolve crypto symbol.");
  }

  const data = (await response.json()) as { coins?: CoinSearchMatch[] };
  const coins = data.coins ?? [];
  if (coins.length === 0) return null;

  const exactMatch = coins.find((coin) => coin.symbol.toUpperCase() === symbol.toUpperCase());
  return (exactMatch ?? coins[0]).id;
}

/** Batched live USD price fetch for already-resolved CoinGecko ids. */
export async function fetchLivePrices(coinIds: string[]): Promise<Record<string, number>> {
  if (coinIds.length === 0) return {};

  const idsParam = encodeURIComponent(coinIds.join(","));
  const response = await fetch(`${BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd`);
  if (!response.ok) {
    throw new Error("Failed to fetch live crypto prices.");
  }

  const data = (await response.json()) as Record<string, { usd?: number }>;
  const prices: Record<string, number> = {};
  for (const [id, value] of Object.entries(data)) {
    if (typeof value.usd === "number") {
      prices[id] = value.usd;
    }
  }
  return prices;
}
