"use client";

import { Banknote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPKR } from "@/lib/format";
import type { Dividend } from "@/types/dividend";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const chartConfig: ChartConfig = {
  value: { label: "Dividends (PKR)" },
};

interface DividendsBySymbolChartProps {
  dividends: Dividend[];
}

export function DividendsBySymbolChart({ dividends }: DividendsBySymbolChartProps) {
  const totals = new Map<string, number>();
  for (const dividend of dividends) {
    totals.set(dividend.symbol, (totals.get(dividend.symbol) ?? 0) + dividend.amount);
  }

  const data = Array.from(totals.entries())
    .map(([symbol, value]) => ({ symbol, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No dividends yet"
        description="Dividend income by symbol will appear here."
      />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="max-h-72 w-full">
      <BarChart data={data} margin={{ left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="symbol" tickLine={false} axisLine={false} />
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
          {data.map((entry, index) => (
            <Cell key={entry.symbol} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
