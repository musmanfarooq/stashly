import type { CurrencyCode } from "./currency";

/** Formats an amount that is already in the target currency (post-conversion). */
export function formatCurrencyAmount(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
