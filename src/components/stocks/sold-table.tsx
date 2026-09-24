"use client";

import { Lock } from "lucide-react";
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
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import { assetUnitLabel } from "@/lib/asset-labels";

interface SoldTableProps {
  userId: string;
  assetClass: AssetClass;
  searchQuery?: string;
}

export function SoldTable({ userId, assetClass, searchQuery = "" }: SoldTableProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Lock}
        title="Couldn't load sold transactions"
        description="Something went wrong fetching your sales. Please try again."
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const sells = (transactions ?? [])
    .filter((t) => t.action === "sell")
    .filter(
      (t) =>
        query.length === 0 ||
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sells.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title={query ? "No matching sold records" : "No sales yet"}
        description={
          query
            ? "Try a different symbol or name."
            : "Shares you sell will show up here permanently, tagged Sold."
        }
      />
    );
  }

  const unitLabel = assetUnitLabel(assetClass);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">{unitLabel} sold</TableHead>
          <TableHead className="text-right">Sell price (PKR)</TableHead>
          <TableHead>Sell date</TableHead>
          <TableHead className="text-right">Realized P/L (PKR)</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sells.map((sell) => {
          const pl = sell.realizedPL ?? 0;
          return (
            <TableRow key={sell.id}>
              <TableCell className="font-medium">{sell.symbol}</TableCell>
              <TableCell className="text-muted-foreground">{sell.name}</TableCell>
              <TableCell className="text-right">{sell.shares}</TableCell>
              <TableCell className="text-right">{sell.price.toFixed(2)}</TableCell>
              <TableCell>{sell.date}</TableCell>
              <TableCell className={`text-right ${pl >= 0 ? "text-profit" : "text-loss"}`}>
                {pl.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="gap-1">
                  <Lock className="size-3" />
                  Sold
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
