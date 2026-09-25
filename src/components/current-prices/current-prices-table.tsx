"use client";

import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { assetUnitLabel } from "@/lib/asset-labels";
import { formatPKR } from "@/lib/format";
import { computeActivePositions } from "@/lib/portfolio-stats";
import { useGetCurrentPricesQuery } from "@/store/api/currentPricesApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import { PriceCell } from "./price-cell";

interface Row {
  symbol: string;
  name: string | null;
  category: string | null;
  totalShares: number | null;
  avgCost: number | null;
  currentPrice: number | null;
}

interface CurrentPricesTableProps {
  userId: string;
  assetClass: AssetClass;
}

export function CurrentPricesTable({ userId, assetClass }: CurrentPricesTableProps) {
  const { data: transactions, isLoading: txLoading, isError: txError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });
  const { data: prices, isLoading: pricesLoading, isError: pricesError } = useGetCurrentPricesQuery();

  if (txLoading || pricesLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (txError || pricesError) {
    return (
      <EmptyState
        icon={Tag}
        title="Couldn't load prices"
        description="Something went wrong fetching this data. Please try again."
      />
    );
  }

  const positions = computeActivePositions(transactions ?? []);
  const pricesForClass = (prices ?? []).filter((price) => price.assetClass === assetClass);

  const rows = new Map<string, Row>();
  for (const position of positions) {
    rows.set(position.symbol, {
      symbol: position.symbol,
      name: position.name,
      category: position.category,
      totalShares: position.totalShares,
      avgCost: position.avgCost,
      currentPrice: null,
    });
  }
  for (const price of pricesForClass) {
    const existing = rows.get(price.symbol);
    if (existing) {
      existing.currentPrice = price.price;
    } else {
      rows.set(price.symbol, {
        symbol: price.symbol,
        name: null,
        category: null,
        totalShares: null,
        avgCost: null,
        currentPrice: price.price,
      });
    }
  }

  const sortedRows = Array.from(rows.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));

  if (sortedRows.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No symbols to price yet"
        description="Symbols you hold, or manually add a price for, will appear here."
      />
    );
  }

  const totalUnrealized = sortedRows.reduce((sum, row) => {
    if (row.avgCost === null || row.currentPrice === null || row.totalShares === null) return sum;
    return sum + (row.currentPrice - row.avgCost) * row.totalShares;
  }, 0);

  const unitLabel = assetUnitLabel(assetClass);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Portfolio-wide unrealized P/L (priced symbols only):{" "}
        <span className={totalUnrealized >= 0 ? "text-profit" : "text-loss"}>
          {formatPKR(totalUnrealized)}
        </span>
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">{unitLabel} held</TableHead>
            <TableHead className="text-right">Avg. buy price (PKR)</TableHead>
            <TableHead>Current price (PKR)</TableHead>
            <TableHead className="text-right">Unrealized P/L (PKR)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const unrealized =
              row.avgCost !== null && row.currentPrice !== null && row.totalShares !== null
                ? (row.currentPrice - row.avgCost) * row.totalShares
                : null;
            return (
              <TableRow key={row.symbol}>
                <TableCell className="font-medium">{row.symbol}</TableCell>
                <TableCell className="text-muted-foreground">{row.name ?? "—"}</TableCell>
                <TableCell>
                  {row.category ? <Badge variant="secondary">{row.category}</Badge> : "—"}
                </TableCell>
                <TableCell className="text-right">{row.totalShares ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {row.avgCost !== null ? row.avgCost.toFixed(2) : "—"}
                </TableCell>
                <TableCell>
                  <PriceCell
                    symbol={row.symbol}
                    assetClass={assetClass}
                    currentPrice={row.currentPrice}
                    updatedBy={userId}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {unrealized !== null ? (
                    <span className={unrealized >= 0 ? "text-profit" : "text-loss"}>
                      {unrealized.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
