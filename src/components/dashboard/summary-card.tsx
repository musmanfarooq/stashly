import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryRow {
  label: string;
  value: string;
  valueClassName?: string;
}

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  rows: SummaryRow[];
}

export function SummaryCard({ icon: Icon, title, rows }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className={`text-lg font-semibold ${row.valueClassName ?? ""}`}>
              {row.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
