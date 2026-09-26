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
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useLiveCryptoPrices } from "@/hooks/use-live-crypto-prices";
import { useLivePsxPrices } from "@/hooks/use-live-psx-prices";
import { computeActivePositions } from "@/lib/portfolio-stats";
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
  const { convertAmount, currency } = useDisplayCurrency(assetClass);
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });

  const allPositions = computeActivePositions(transactions ?? []);
  const symbols = allPositions.map((p) => p.symbol);
  // Both called unconditionally (Rules of Hooks) — each internally skips its
  // fetch for an empty symbol list, and polls the live feed every 60s
  // otherwise, since this table is what the Stocks and Crypto pages render.
  const { livePrices: liveStockPrices } = useLivePsxPrices(assetClass === "stock" ? symbols : []);
  const { livePrices: liveCryptoPrices } = useLiveCryptoPrices(assetClass === "crypto" ? symbols : []);
  const livePrices = assetClass === "stock" ? liveStockPrices : liveCryptoPrices;

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
  const positions = allPositions.filter(
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

  const priceBySymbol = new Map(Object.entries(livePrices));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">{assetUnitLabel(assetClass)} held</TableHead>
          <TableHead className="text-right">Avg. cost ({currency})</TableHead>
          <TableHead className="text-right">Current price ({currency})</TableHead>
          <TableHead className="text-right">Unrealized P/L ({currency})</TableHead>
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
              <TableCell className="text-right">{convertAmount(position.avgCost).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                {currentPrice !== undefined ? (
                  convertAmount(currentPrice).toFixed(2)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {unrealizedPL !== null ? (
                  <span className={unrealizedPL >= 0 ? "text-profit" : "text-loss"}>
                    {convertAmount(unrealizedPL).toFixed(2)}
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
