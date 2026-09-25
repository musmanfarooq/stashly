"use client";

import { Layers } from "lucide-react";
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
import { computeActivePositions } from "@/lib/portfolio-stats";
import { useGetCurrentPricesQuery } from "@/store/api/currentPricesApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import { assetUnitLabel } from "@/lib/asset-labels";
import { SellStockDialog } from "./sell-stock-dialog";

interface PositionsTableProps {
  userId: string;
  assetClass: AssetClass;
  searchQuery?: string;
}

export function PositionsTable({ userId, assetClass, searchQuery = "" }: PositionsTableProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });
  const { data: currentPrices, isLoading: pricesLoading } = useGetCurrentPricesQuery();

  if (isLoading || pricesLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Layers}
        title="Couldn't load positions"
        description="Something went wrong fetching your holdings. Please try again."
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const positions = computeActivePositions(transactions ?? []).filter(
    (position) =>
      query.length === 0 ||
      position.symbol.toLowerCase().includes(query) ||
      position.name.toLowerCase().includes(query),
  );

  if (positions.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title={query ? "No matching positions" : "No active positions yet"}
        description={
          query
            ? "Try a different symbol or name."
            : `Add a ${assetClass === "stock" ? "stock" : "crypto"} purchase to get started.`
        }
      />
    );
  }

  const priceBySymbol = new Map(
    (currentPrices ?? [])
      .filter((price) => price.assetClass === assetClass)
      .map((price) => [price.symbol, price.price]),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">{assetUnitLabel(assetClass)} held</TableHead>
          <TableHead className="text-right">Avg. cost (PKR)</TableHead>
          <TableHead className="text-right">Current price (PKR)</TableHead>
          <TableHead className="text-right">Unrealized P/L (PKR)</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => {
          const currentPrice = priceBySymbol.get(position.symbol);
          const unrealizedPL =
            currentPrice !== undefined ? (currentPrice - position.avgCost) * position.totalShares : null;

          return (
            <TableRow key={position.symbol}>
              <TableCell className="font-medium">{position.symbol}</TableCell>
              <TableCell className="text-muted-foreground">{position.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{position.category}</Badge>
              </TableCell>
              <TableCell className="text-right">{position.totalShares}</TableCell>
              <TableCell className="text-right">{position.avgCost.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                {currentPrice !== undefined ? (
                  currentPrice.toFixed(2)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {unrealizedPL !== null ? (
                  <span className={unrealizedPL >= 0 ? "text-profit" : "text-loss"}>
                    {unrealizedPL.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <SellStockDialog
                  userId={userId}
                  assetClass={assetClass}
                  symbol={position.symbol}
                  availableShares={position.totalShares}
                  avgCost={position.avgCost}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
