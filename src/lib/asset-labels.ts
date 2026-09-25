import type { AssetClass } from "@/types/transaction";
import type { CurrencyCode } from "@/lib/currency";

export function assetNoun(assetClass: AssetClass): string {
  return assetClass === "stock" ? "Stock" : "Crypto";
}

/**
 * The currency amounts are actually recorded/entered in for this asset
 * class — fixed, not a user preference. PSX stocks trade in PKR; crypto is
 * almost universally quoted in USD. The Settings currency picker only
 * controls display conversion from this native currency, never storage.
 */
export function assetNativeCurrency(assetClass: AssetClass): CurrencyCode {
  return assetClass === "stock" ? "PKR" : "USD";
}

export function assetUnitLabel(assetClass: AssetClass): string {
  return assetClass === "stock" ? "Shares" : "Units";
}

export function assetSymbolPlaceholder(assetClass: AssetClass): string {
  return assetClass === "stock" ? "e.g. OGDC" : "e.g. BTC";
}

export function assetNamePlaceholder(assetClass: AssetClass): string {
  return assetClass === "stock" ? "e.g. Oil & Gas Development Co" : "e.g. Bitcoin";
}
