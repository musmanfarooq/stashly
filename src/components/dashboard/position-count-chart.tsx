"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  value: { label: "Positions" },
};

interface PositionCountChartProps {
  activeCount: number;
  soldCount: number;
}

export function PositionCountChart({ activeCount, soldCount }: PositionCountChartProps) {
  const data = [
    { status: "Active", value: activeCount },
    { status: "Sold", value: soldCount },
  ];

  return (
    <ChartContainer config={chartConfig} className="max-h-72 w-full">
      <BarChart data={data} margin={{ left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="status" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" radius={4}>
          <Cell fill="var(--chart-1)" />
          <Cell fill="var(--chart-4)" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
