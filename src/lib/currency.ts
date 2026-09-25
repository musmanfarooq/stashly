export const SUPPORTED_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "PKR";

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  PKR: "PKR — Pakistani Rupee",
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  INR: "INR — Indian Rupee",
  AED: "AED — UAE Dirham",
  SAR: "SAR — Saudi Riyal",
};

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
