import { NextResponse } from "next/server";
import { fetchPsxMarketPrices } from "@/services/psx-market-data";

/**
 * Server-side proxy: the upstream PSX data source doesn't send CORS
 * headers, so the browser can't call it directly. This route runs
 * server-side (no CORS restriction) and the client calls this same-origin
 * endpoint instead. Filters down to just the requested symbols so the
 * response stays small regardless of how big the full PSX market snapshot is.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const allPrices = await fetchPsxMarketPrices();
    const prices: Record<string, number> = {};
    for (const symbol of symbols) {
      if (allPrices[symbol] !== undefined) {
        prices[symbol] = allPrices[symbol];
      }
    }
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PSX prices." }, { status: 502 });
  }
}
