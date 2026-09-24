"use client";

import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import {
  computeActiveSymbolCount,
  computeAllocationByCategory,
  computeSoldSymbolCount,
  computeTotalInvested,
  computeTotalRealizedPL,
} from "@/lib/portfolio-stats";
import { AllocationChart } from "./allocation-chart";
import { InvestedVsRealizedChart } from "./invested-vs-realized-chart";
import { PositionCountChart } from "./position-count-chart";

interface AssetGraphsPanelProps {
  userId: string;
  assetClass: AssetClass;
}

export function AssetGraphsPanel({ userId, assetClass }: AssetGraphsPanelProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery({
    userId,
    assetClass,
  });

  if (isLoading) {
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

  return (
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
  );
}
