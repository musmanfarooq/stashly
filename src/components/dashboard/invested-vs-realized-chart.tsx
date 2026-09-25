"use client";

import { TwoMetricBarChart } from "./two-metric-bar-chart";

interface InvestedVsRealizedChartProps {
  invested: number;
  realizedPL: number;
}

export function InvestedVsRealizedChart({ invested, realizedPL }: InvestedVsRealizedChartProps) {
  return (
    <TwoMetricBarChart
      leftLabel="Invested"
      leftValue={invested}
      rightLabel="Realized P/L"
      rightValue={realizedPL}
    />
  );
}
