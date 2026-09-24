"use client";

import { Layers, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import {
  computeActiveSymbolCount,
  computeSoldSymbolCount,
  computeTotalInvested,
  computeTotalRealizedPL,
} from "@/lib/portfolio-stats";
import { formatPKR } from "@/lib/format";
import { SummaryCard } from "./summary-card";
import { AssetGraphsPanel } from "./asset-graphs-panel";

interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  const stockQuery = useGetTransactionsQuery({ userId, assetClass: "stock" });
  const cryptoQuery = useGetTransactionsQuery({ userId, assetClass: "crypto" });

  const isLoading = stockQuery.isLoading || cryptoQuery.isLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const stockTx = stockQuery.data ?? [];
  const cryptoTx = cryptoQuery.data ?? [];

  const stockInvested = computeTotalInvested(stockTx);
  const cryptoInvested = computeTotalInvested(cryptoTx);
  const stockRealized = computeTotalRealizedPL(stockTx);
  const cryptoRealized = computeTotalRealizedPL(cryptoTx);
  const stockActive = computeActiveSymbolCount(stockTx);
  const stockSold = computeSoldSymbolCount(stockTx);
  const cryptoActive = computeActiveSymbolCount(cryptoTx);
  const cryptoSold = computeSoldSymbolCount(cryptoTx);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Wallet}
          title="Total invested (cost basis)"
          rows={[
            { label: "Stocks", value: formatPKR(stockInvested) },
            { label: "Crypto", value: formatPKR(cryptoInvested) },
          ]}
        />
        <SummaryCard
          icon={TrendingUp}
          title="Total realized P/L"
          rows={[
            {
              label: "Stocks",
              value: formatPKR(stockRealized),
              valueClassName: stockRealized >= 0 ? "text-profit" : "text-loss",
            },
            {
              label: "Crypto",
              value: formatPKR(cryptoRealized),
              valueClassName: cryptoRealized >= 0 ? "text-profit" : "text-loss",
            },
          ]}
        />
        <SummaryCard
          icon={Layers}
          title="Active vs sold positions"
          rows={[
            { label: "Stocks", value: `${stockActive} active / ${stockSold} sold` },
            { label: "Crypto", value: `${cryptoActive} active / ${cryptoSold} sold` },
          ]}
        />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <AssetGraphsPanel userId={userId} assetClass="stock" />
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          <AssetGraphsPanel userId={userId} assetClass="crypto" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
