"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPKR } from "@/lib/format";

const chartConfig: ChartConfig = {
  value: { label: "Amount (PKR)" },
};

interface TwoMetricBarChartProps {
  leftLabel: string;
  leftValue: number;
  leftColor?: string;
  rightLabel: string;
  rightValue: number;
  rightColor?: string;
}

export function TwoMetricBarChart({
  leftLabel,
  leftValue,
  leftColor = "var(--chart-1)",
  rightLabel,
  rightValue,
  rightColor,
}: TwoMetricBarChartProps) {
  const data = [
    { metric: leftLabel, value: leftValue },
    { metric: rightLabel, value: rightValue },
  ];
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
          tickFormatter={(value: number) => formatPKR(value)}
        />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel formatter={(value) => formatPKR(Number(value))} />}
        />
        <Bar dataKey="value" radius={4}>
          <Cell fill={leftColor} />
          <Cell fill={resolvedRightColor} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
