"use client";

import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useGetCurrentPricesQuery } from "@/store/api/currentPricesApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import {
  computeActiveSymbolCount,
  computeAllocationByCategory,
  computeAllocationByCurrentValue,
  computePricedPositions,
  computeSoldSymbolCount,
  computeTotalInvested,
  computeTotalRealizedPL,
  computeTotalUnrealizedPL,
} from "@/lib/portfolio-stats";
import { AllocationChart } from "./allocation-chart";
import { InvestedVsRealizedChart } from "./invested-vs-realized-chart";
import { PositionCountChart } from "./position-count-chart";
import { TopMoversChart } from "./top-movers-chart";
import { TwoMetricBarChart } from "./two-metric-bar-chart";

interface AssetGraphsPanelProps {
  userId: string;
  assetClass: AssetClass;
}

export function AssetGraphsPanel({ userId, assetClass }: AssetGraphsPanelProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });
  const { data: currentPrices, isLoading: pricesLoading } = useGetCurrentPricesQuery();

  if (isLoading || pricesLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={LineChart}
        title="Couldn't load graphs"
        description="Something went wrong fetching your data. Please try again."
      />
    );
  }

  const list = transactions ?? [];
  const allocation = computeAllocationByCategory(list);
  const invested = computeTotalInvested(list);
  const realizedPL = computeTotalRealizedPL(list);
  const activeCount = computeActiveSymbolCount(list);
  const soldCount = computeSoldSymbolCount(list);

  const pricedForClass = (currentPrices ?? []).filter((price) => price.assetClass === assetClass);
  const pricedPositions = computePricedPositions(list, pricedForClass);
  const totalCurrentValue = pricedPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalUnrealizedPL = computeTotalUnrealizedPL(pricedPositions);
  const allocationByCurrentValue = computeAllocationByCurrentValue(pricedPositions);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Allocation by type</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationChart data={allocation} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Invested vs realized P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestedVsRealizedChart invested={invested} realizedPL={realizedPL} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active vs sold positions</CardTitle>
          </CardHeader>
          <CardContent>
            <PositionCountChart activeCount={activeCount} soldCount={soldCount} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Invested vs current value</CardTitle>
          </CardHeader>
          <CardContent>
            {pricedPositions.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="No priced positions yet"
                description="Set a current price for a symbol you hold to see this chart."
              />
            ) : (
              <TwoMetricBarChart
                leftLabel="Invested"
                leftValue={invested}
                rightLabel="Current value"
                rightValue={totalCurrentValue}
                rightColor="var(--chart-3)"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Realized vs unrealized P/L</CardTitle>
          </CardHeader>
          <CardContent>
            {pricedPositions.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="No priced positions yet"
                description="Unrealized P/L needs at least one priced symbol."
              />
            ) : (
              <TwoMetricBarChart
                leftLabel="Realized"
                leftValue={realizedPL}
                leftColor={realizedPL >= 0 ? "var(--profit)" : "var(--loss)"}
                rightLabel="Unrealized"
                rightValue={totalUnrealizedPL}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top movers</CardTitle>
          </CardHeader>
          <CardContent>
            <TopMoversChart positions={pricedPositions} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Allocation by current value</CardTitle>
        </CardHeader>
        <CardContent>
          <AllocationChart data={allocationByCurrentValue} />
        </CardContent>
      </Card>
    </div>
  );
}
