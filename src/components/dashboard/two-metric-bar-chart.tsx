"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { formatCurrencyAmount } from "@/lib/format";
import type { AssetClass } from "@/types/transaction";

const chartConfig: ChartConfig = {
  value: { label: "Amount" },
};

interface TwoMetricBarChartProps {
  assetClass: AssetClass;
  leftLabel: string;
  leftValue: number;
  leftColor?: string;
  rightLabel: string;
  rightValue: number;
  rightColor?: string;
}

export function TwoMetricBarChart({
  assetClass,
  leftLabel,
  leftValue,
  leftColor = "var(--chart-1)",
  rightLabel,
  rightValue,
  rightColor,
}: TwoMetricBarChartProps) {
  const { convertAmount, currency } = useDisplayCurrency(assetClass);
  const data = [
    { metric: leftLabel, value: convertAmount(leftValue) },
    { metric: rightLabel, value: convertAmount(rightValue) },
  ];
  // data[].value is already converted — format only, don't convert again.
  const formatAlreadyConverted = (value: number) => formatCurrencyAmount(value, currency);
  // Sign is invariant under currency conversion (rates are always positive),
  // so it's safe to branch on the original native-currency value here.
  const resolvedRightColor = rightColor ?? (rightValue >= 0 ? "var(--profit)" : "var(--loss)");

  return (
    <ChartContainer config={chartConfig} className="max-h-72 w-full">
      <BarChart data={data} margin={{ left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="metric" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={90}
          tickFormatter={(value: number) => formatAlreadyConverted(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => formatAlreadyConverted(Number(value))}
            />
          }
        />
        <Bar dataKey="value" radius={4}>
          <Cell fill={leftColor} />
          <Cell fill={resolvedRightColor} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
