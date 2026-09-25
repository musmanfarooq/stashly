"use client";

import type { AssetClass } from "@/types/transaction";
import { TwoMetricBarChart } from "./two-metric-bar-chart";

interface InvestedVsRealizedChartProps {
  assetClass: AssetClass;
  invested: number;
  realizedPL: number;
}

export function InvestedVsRealizedChart({
  assetClass,
  invested,
  realizedPL,
}: InvestedVsRealizedChartProps) {
  return (
    <TwoMetricBarChart
      assetClass={assetClass}
      leftLabel="Invested"
      leftValue={invested}
      rightLabel="Realized P/L"
      rightValue={realizedPL}
    />
  );
}
