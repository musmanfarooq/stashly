"use client";

import { Banknote, Layers, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DividendsBySymbolChart } from "@/components/dividends/dividends-by-symbol-chart";
import { useGetCurrentPricesQuery } from "@/store/api/currentPricesApi";
import { useGetDividendsQuery } from "@/store/api/dividendsApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import {
  computeActiveSymbolCount,
  computePricedPositions,
  computeSoldSymbolCount,
  computeTotalInvested,
  computeTotalRealizedPL,
  computeTotalUnrealizedPL,
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
  const pricesQuery = useGetCurrentPricesQuery();
  const dividendsQuery = useGetDividendsQuery(userId);

  const isLoading =
    stockQuery.isLoading || cryptoQuery.isLoading || pricesQuery.isLoading || dividendsQuery.isLoading;

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
  const prices = pricesQuery.data ?? [];
  const dividends = dividendsQuery.data ?? [];

  const stockInvested = computeTotalInvested(stockTx);
  const cryptoInvested = computeTotalInvested(cryptoTx);
  const stockRealized = computeTotalRealizedPL(stockTx);
  const cryptoRealized = computeTotalRealizedPL(cryptoTx);
  const stockActive = computeActiveSymbolCount(stockTx);
  const stockSold = computeSoldSymbolCount(stockTx);
  const cryptoActive = computeActiveSymbolCount(cryptoTx);
  const cryptoSold = computeSoldSymbolCount(cryptoTx);

  const stockPriced = computePricedPositions(stockTx, prices.filter((p) => p.assetClass === "stock"));
  const cryptoPriced = computePricedPositions(cryptoTx, prices.filter((p) => p.assetClass === "crypto"));
  const stockUnrealized = computeTotalUnrealizedPL(stockPriced);
  const cryptoUnrealized = computeTotalUnrealizedPL(cryptoPriced);

  const totalDividends = dividends.reduce((sum, dividend) => sum + dividend.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          icon={TrendingUp}
          title="Total unrealized P/L"
          rows={[
            {
              label: "Stocks",
              value: stockPriced.length > 0 ? formatPKR(stockUnrealized) : "—",
              valueClassName: stockUnrealized >= 0 ? "text-profit" : "text-loss",
            },
            {
              label: "Crypto",
              value: cryptoPriced.length > 0 ? formatPKR(cryptoUnrealized) : "—",
              valueClassName: cryptoUnrealized >= 0 ? "text-profit" : "text-loss",
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
        <SummaryCard
          icon={Banknote}
          title="Total dividends earned"
          rows={[{ label: "Stocks", value: formatPKR(totalDividends), valueClassName: "text-profit" }]}
        />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4 space-y-4">
          <AssetGraphsPanel userId={userId} assetClass="stock" />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Dividends by symbol</CardTitle>
            </CardHeader>
            <CardContent>
              <DividendsBySymbolChart dividends={dividends} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          <AssetGraphsPanel userId={userId} assetClass="crypto" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
