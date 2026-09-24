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

interface InvestedVsRealizedChartProps {
  invested: number;
  realizedPL: number;
}

export function InvestedVsRealizedChart({ invested, realizedPL }: InvestedVsRealizedChartProps) {
  const data = [
    { metric: "Invested", value: invested },
    { metric: "Realized P/L", value: realizedPL },
  ];

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
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => formatPKR(Number(value))}
            />
          }
        />
        <Bar dataKey="value" radius={4}>
          <Cell fill="var(--chart-1)" />
          <Cell fill={realizedPL >= 0 ? "var(--profit)" : "var(--loss)"} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
