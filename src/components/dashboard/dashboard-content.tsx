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
  computeSoldSymbolCount,
  computeTotalInvested,
  computeTotalRealizedPL,
  computeTotalUnrealizedPL,
} from "@/lib/portfolio-stats";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePricedPositions } from "@/hooks/use-priced-positions";
import { SummaryCard } from "./summary-card";
import { AssetGraphsPanel } from "./asset-graphs-panel";

interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  const { formatAmount: formatStockAmount } = useDisplayCurrency("stock");
  const { formatAmount: formatCryptoAmount } = useDisplayCurrency("crypto");
  const stockQuery = useGetTransactionsQuery({ userId, assetClass: "stock" });
  const cryptoQuery = useGetTransactionsQuery({ userId, assetClass: "crypto" });
  const pricesQuery = useGetCurrentPricesQuery();
  const dividendsQuery = useGetDividendsQuery(userId);

  const stockTx = stockQuery.data ?? [];
  const cryptoTx = cryptoQuery.data ?? [];
  const prices = pricesQuery.data ?? [];
  const dividends = dividendsQuery.data ?? [];

  // Called unconditionally (Rules of Hooks) — the crypto call also polls the
  // live feed every 60s, since the Dashboard is one of the two pages that should.
  const stockPriced = usePricedPositions(
    stockTx,
    "stock",
    prices.filter((p) => p.assetClass === "stock"),
  );
  const cryptoPriced = usePricedPositions(
    cryptoTx,
    "crypto",
    prices.filter((p) => p.assetClass === "crypto"),
  );

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

  const stockInvested = computeTotalInvested(stockTx);
  const cryptoInvested = computeTotalInvested(cryptoTx);
  const stockRealized = computeTotalRealizedPL(stockTx);
  const cryptoRealized = computeTotalRealizedPL(cryptoTx);
  const stockActive = computeActiveSymbolCount(stockTx);
  const stockSold = computeSoldSymbolCount(stockTx);
  const cryptoActive = computeActiveSymbolCount(cryptoTx);
  const cryptoSold = computeSoldSymbolCount(cryptoTx);

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
            { label: "Stocks", value: formatStockAmount(stockInvested) },
            { label: "Crypto", value: formatCryptoAmount(cryptoInvested) },
          ]}
        />
        <SummaryCard
          icon={TrendingUp}
          title="Total realized P/L"
          rows={[
            {
              label: "Stocks",
              value: formatStockAmount(stockRealized),
              valueClassName: stockRealized >= 0 ? "text-profit" : "text-loss",
            },
            {
              label: "Crypto",
              value: formatCryptoAmount(cryptoRealized),
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
              value: stockPriced.length > 0 ? formatStockAmount(stockUnrealized) : "—",
              valueClassName: stockUnrealized >= 0 ? "text-profit" : "text-loss",
            },
            {
              label: "Crypto",
              value: cryptoPriced.length > 0 ? formatCryptoAmount(cryptoUnrealized) : "—",
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
          rows={[{ label: "Stocks", value: formatStockAmount(totalDividends), valueClassName: "text-profit" }]}
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
