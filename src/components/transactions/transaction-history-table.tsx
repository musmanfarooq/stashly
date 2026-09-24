"use client";

import { useState } from "react";
import { ArrowDownUp, Download, History, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { exportTransactionHistoryPdf } from "@/lib/pdf/transaction-history-pdf";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import { assetUnitLabel } from "@/lib/asset-labels";

interface TransactionHistoryTableProps {
  userId: string;
  assetClass: AssetClass;
}

export function TransactionHistoryTable({ userId, assetClass }: TransactionHistoryTableProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportUpToDate, setExportUpToDate] = useState("");

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
        icon={History}
        title="Couldn't load transaction history"
        description="Something went wrong fetching your transactions. Please try again."
      />
    );
  }

  const filtered = (transactions ?? [])
    .filter((t) => !dateFrom || t.date >= dateFrom)
    .filter((t) => !dateTo || t.date <= dateTo)
    .sort((a, b) => {
      const comparison = a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      return sortDir === "asc" ? comparison : -comparison;
    });

  const unitLabel = assetUnitLabel(assetClass);

  function handleDownload() {
    if (!transactions || transactions.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    exportTransactionHistoryPdf(transactions, assetClass, exportUpToDate || undefined);
    toast.success("Transaction history PDF downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="history-from">From date</Label>
          <Input
            id="history-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-40"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="history-to">To date</Label>
          <Input
            id="history-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-40"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setSortDir((dir) => (dir === "desc" ? "asc" : "desc"))}
        >
          <ArrowDownUp className="size-4" />
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </Button>
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="export-up-to">Export up to date (optional)</Label>
          <Input
            id="export-up-to"
            type="date"
            value={exportUpToDate}
            onChange={(event) => setExportUpToDate(event.target.value)}
            className="w-40"
          />
        </div>
        <Button type="button" className="gap-2" onClick={handleDownload}>
          <Download className="size-4" />
          Download PDF
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No transactions yet"
          description="Every buy and sell you record will appear here, permanently."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="text-right">{unitLabel}</TableHead>
              <TableHead className="text-right">Price (PKR)</TableHead>
              <TableHead className="text-right">Realized P/L (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="font-medium">{transaction.symbol}</TableCell>
                <TableCell>
                  {transaction.action === "buy" ? (
                    <Badge className="gap-1 bg-buy text-buy-foreground hover:bg-buy/80">
                      <TrendingUp className="size-3" />
                      Buy
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-sell text-sell-foreground hover:bg-sell/80">
                      <TrendingDown className="size-3" />
                      Sell
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{transaction.shares}</TableCell>
                <TableCell className="text-right">{transaction.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {transaction.action === "sell" && transaction.realizedPL !== null ? (
                    <span className={transaction.realizedPL >= 0 ? "text-profit" : "text-loss"}>
                      {transaction.realizedPL.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
