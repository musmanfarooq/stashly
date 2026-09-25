"use client";

import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { formatCurrencyAmount } from "@/lib/format";
import { useGetExchangeRatesQuery } from "@/store/api/exchangeRatesApi";
import { useAppSelector } from "@/store/hooks";
import type { AssetClass } from "@/types/transaction";

/**
 * Stocks are recorded in PKR (PSX) and converted for display per the user's
 * chosen currency (users/{uid}.currency, default PKR). Crypto is recorded
 * *and always displayed* in USD — fixed, never converted, unaffected by the
 * display-currency setting (crypto is universally USD-denominated in
 * practice, so there's nothing to convert). Actual math (average cost,
 * realized/unrealized P/L) always happens in each asset class's own native
 * currency internally, regardless of this hook.
 */
export function useDisplayCurrency(assetClass: AssetClass) {
  const preferredCurrency = (useAppSelector((state) => state.auth.user?.currency) ??
    DEFAULT_CURRENCY) as CurrencyCode;
  const isCrypto = assetClass === "crypto";
  // Crypto never converts, so it never needs rates — skip the fetch then too.
  const { data: rates, isLoading } = useGetExchangeRatesQuery(undefined, {
    skip: isCrypto || preferredCurrency === "PKR",
  });

  if (isCrypto) {
    return {
      currency: "USD" as CurrencyCode,
      convertAmount: (usdAmount: number) => usdAmount,
      formatAmount: (usdAmount: number) => formatCurrencyAmount(usdAmount, "USD"),
      isLoading: false,
    };
  }

  function convertAmount(pkrAmount: number): number {
    if (preferredCurrency === "PKR") return pkrAmount;
    const rate = rates?.[preferredCurrency.toLowerCase()];
    // Rates not loaded yet (rare, brief window) — fall back to the raw PKR
    // number rather than block rendering on every consumer of this hook.
    return rate === undefined ? pkrAmount : pkrAmount * rate;
  }

  function formatAmount(pkrAmount: number): string {
    return formatCurrencyAmount(convertAmount(pkrAmount), preferredCurrency);
  }

  return { currency: preferredCurrency, convertAmount, formatAmount, isLoading };
}
