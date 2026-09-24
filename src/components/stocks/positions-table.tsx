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
import { computeAverageCost } from "@/services/firebase/transactions";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass, Transaction } from "@/types/transaction";
import { assetUnitLabel } from "@/lib/asset-labels";
import { SellStockDialog } from "./sell-stock-dialog";

interface Position {
  symbol: string;
  name: string;
  category: string;
  totalShares: number;
  avgCost: number;
}

function groupIntoPositions(transactions: Transaction[] | undefined): Position[] {
  const buyLotsBySymbol = new Map<string, Transaction[]>();

  for (const t of transactions ?? []) {
    if (t.action !== "buy") continue;
    const lots = buyLotsBySymbol.get(t.symbol) ?? [];
    lots.push(t);
    buyLotsBySymbol.set(t.symbol, lots);
  }

  const positions: Position[] = [];
  for (const [symbol, lots] of buyLotsBySymbol) {
    const activeShares = lots.reduce((sum, lot) => sum + (lot.locked ? 0 : lot.remainingShares), 0);
    if (activeShares <= 0) continue;

    const latestLot = [...lots].sort((a, b) => b.createdAt - a.createdAt)[0];
    positions.push({
      symbol,
      name: latestLot.name,
      category: latestLot.category,
      totalShares: activeShares,
      avgCost: computeAverageCost(lots),
    });
  }

  return positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

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

  if (isLoading) {
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
  const positions = groupIntoPositions(transactions).filter(
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">{assetUnitLabel(assetClass)} held</TableHead>
          <TableHead className="text-right">Avg. cost (PKR)</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.symbol}>
            <TableCell className="font-medium">{position.symbol}</TableCell>
            <TableCell className="text-muted-foreground">{position.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{position.category}</Badge>
            </TableCell>
            <TableCell className="text-right">{position.totalShares}</TableCell>
            <TableCell className="text-right">{position.avgCost.toFixed(2)}</TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
}
