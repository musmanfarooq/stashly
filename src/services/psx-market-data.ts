/**
 * PSX has no official public API. This scrapes PSX's own market-summary
 * page (server-rendered HTML, not the dps.psx.com.pk AJAX subdomain, which
 * 403s regardless of headers/origin) — full ~690-symbol coverage, unlike
 * third-party aggregators that only mirror the ~100 most-liquid names.
 *
 * No CORS header is sent by this page, so it can't be fetched directly
 * from the browser — this file is only ever imported by the server-side
 * route handler (src/app/api/psx-prices/route.ts), never client code.
 */
import * as cheerio from "cheerio";

const MARKET_SUMMARY_URL = "https://www.psx.com.pk/market-summary/";

/** Full PSX market snapshot, keyed by ticker symbol. Cached for 60s server-side via Next's fetch cache. */
export async function fetchPsxMarketPrices(): Promise<Record<string, number>> {
  const response = await fetch(MARKET_SUMMARY_URL, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error("Failed to fetch PSX market data.");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const prices: Record<string, number> = {};
  $("td.dataportal[data-srip]").each((_, symbolCell) => {
    const symbol = $(symbolCell).attr("data-srip")?.trim();
    if (!symbol) return;

    // Current price is the 5th <td> sibling after the symbol cell:
    // LDCP, Open, High, Low, Current.
    const currentText = $(symbolCell).nextAll("td").eq(4).text().trim();
    const price = Number(currentText.replace(/,/g, ""));
    if (Number.isFinite(price)) {
      prices[symbol] = price;
    }
  });

  return prices;
}
