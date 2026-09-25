"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPKR } from "@/lib/format";
import type { PricedPosition } from "@/lib/portfolio-stats";

const chartConfig: ChartConfig = {
  unrealizedPL: { label: "Unrealized P/L (PKR)" },
};

interface TopMoversChartProps {
  positions: PricedPosition[];
  limit?: number;
}

export function TopMoversChart({ positions, limit = 5 }: TopMoversChartProps) {
  if (positions.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No priced positions yet"
        description="Once an admin sets a current price for a symbol you hold, movers appear here."
      />
    );
  }

  const sorted = [...positions].sort((a, b) => b.unrealizedPL - a.unrealizedPL);
  const gainers = sorted.filter((p) => p.unrealizedPL > 0).slice(0, limit);
  const losers = sorted
    .filter((p) => p.unrealizedPL < 0)
    .slice(-limit)
    .reverse();
  const data = [...gainers, ...losers]
    .sort((a, b) => a.unrealizedPL - b.unrealizedPL)
    .map((p) => ({ symbol: p.symbol, unrealizedPL: p.unrealizedPL }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No movement yet"
        description="Priced positions are exactly at cost — nothing to rank yet."
      />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="max-h-72 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatPKR(value)}
        />
        <YAxis type="category" dataKey="symbol" tickLine={false} axisLine={false} width={60} />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel formatter={(value) => formatPKR(Number(value))} />}
        />
        <Bar dataKey="unrealizedPL" radius={4}>
          {data.map((entry) => (
            <Cell
              key={entry.symbol}
              fill={entry.unrealizedPL >= 0 ? "var(--profit)" : "var(--loss)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
