/**
 * Free, keyless, open-source exchange rate data (github.com/fawazahmed0/exchange-api).
 * Rates update once a day, so callers should cache aggressively rather than
 * refetching per render — see the RTK Query endpoint in exchangeRatesApi.ts.
 */
const PRIMARY_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json";
const FALLBACK_URL = "https://latest.currency-api.pages.dev/v1/currencies/pkr.json";

interface PkrRatesResponse {
  date: string;
  pkr: Record<string, number>;
}

/** Multipliers to convert a PKR amount into other currencies, keyed by lowercase ISO code. */
export async function fetchPkrExchangeRates(): Promise<Record<string, number>> {
  let response: Response;
  try {
    response = await fetch(PRIMARY_URL);
    if (!response.ok) throw new Error("primary exchange rate source failed");
  } catch {
    response = await fetch(FALLBACK_URL);
  }

  if (!response.ok) {
    throw new Error("Failed to fetch exchange rates.");
  }

  const data = (await response.json()) as PkrRatesResponse;
  return data.pkr;
}
