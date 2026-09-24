import type { AssetClass } from "@/types/transaction";

export function assetNoun(assetClass: AssetClass): string {
  return assetClass === "stock" ? "Stock" : "Crypto";
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
