"use client";

import { PieChart as PieIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPKR } from "@/lib/format";
import type { CategoryAllocation } from "@/lib/portfolio-stats";

// Category names are arbitrary user-entered text (2.5), so they can't safely
// become CSS custom-property keys — colors are assigned by array index instead.
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

interface AllocationChartProps {
  data: CategoryAllocation[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No allocation data yet"
        description="Add a position to see allocation by type."
      />
    );
  }

  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const size = 220;
  const center = size / 2;
  const outerRadius = 100;
  const innerRadius = 60;

  // Prefix sums of value, computed immutably (no cross-iteration mutable
  // accumulator), then converted to angles per slice.
  const cumulativeValues = data.reduce<number[]>((acc, entry) => {
    const previousTotal = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, previousTotal + entry.value];
  }, []);

  const slices = data.map((entry, index) => {
    const startValue = index === 0 ? 0 : cumulativeValues[index - 1];
    const endValue = cumulativeValues[index];
    const startAngle = total > 0 ? (startValue / total) * 360 : 0;
    const endAngle = total > 0 ? (endValue / total) * 360 : 0;
    return {
      ...entry,
      path: describeDonutSlice(center, center, innerRadius, outerRadius, startAngle, endAngle),
      color: PALETTE[index % PALETTE.length],
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation by type">
        {slices.map((slice) => (
          <path key={slice.category} d={slice.path} fill={slice.color} stroke="var(--surface)" strokeWidth={2}>
            <title>{`${slice.category}: ${formatPKR(slice.value)}`}</title>
          </path>
        ))}
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.category} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-foreground">{slice.category}</span>
            <span className="text-muted-foreground">{formatPKR(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
