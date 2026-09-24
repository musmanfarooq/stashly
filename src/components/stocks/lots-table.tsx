"use client";

import { Boxes } from "lucide-react";
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
import { EditStockDialog } from "./edit-stock-dialog";

interface LotsTableProps {
  userId: string;
  assetClass: AssetClass;
  searchQuery?: string;
}

export function LotsTable({ userId, assetClass, searchQuery = "" }: LotsTableProps) {
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
        icon={Boxes}
        title="Couldn't load buy lots"
        description="Something went wrong fetching your transactions. Please try again."
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const activeLots = (transactions ?? [])
    .filter((t) => t.action === "buy" && !t.locked && t.remainingShares > 0)
    .filter(
      (t) =>
        query.length === 0 ||
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  if (activeLots.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title={query ? "No matching active lots" : "No active buy lots yet"}
        description={
          query
            ? "Try a different symbol or name."
            : "Buy lots you haven't fully sold will appear here, editable until sold."
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
          <TableHead>Type</TableHead>
          <TableHead className="text-right">{unitLabel}</TableHead>
          <TableHead className="text-right">Buy price (PKR)</TableHead>
          <TableHead>Buy date</TableHead>
          <TableHead className="text-right">Edit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeLots.map((lot) => {
          const isEditable = lot.remainingShares === lot.shares;
          return (
            <TableRow key={lot.id}>
              <TableCell className="font-medium">{lot.symbol}</TableCell>
              <TableCell className="text-muted-foreground">{lot.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{lot.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {lot.remainingShares}
                {lot.remainingShares !== lot.shares && (
                  <span className="text-muted-foreground"> / {lot.shares}</span>
                )}
              </TableCell>
              <TableCell className="text-right">{lot.price.toFixed(2)}</TableCell>
              <TableCell>{lot.date}</TableCell>
              <TableCell className="text-right">
                {isEditable ? (
                  <EditStockDialog userId={userId} transaction={lot} />
                ) : (
                  <span className="text-xs text-muted-foreground">Partially sold</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
