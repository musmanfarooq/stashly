"use client";

import { Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddDividendDialog } from "@/components/dividends/add-dividend-dialog";
import { DividendsBySymbolChart } from "@/components/dividends/dividends-by-symbol-chart";
import { DividendsTable } from "@/components/dividends/dividends-table";
import { formatPKR } from "@/lib/format";
import { useGetDividendsQuery } from "@/store/api/dividendsApi";
import { useAppSelector } from "@/store/hooks";

export default function DividendsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: dividends, isLoading } = useGetDividendsQuery(user?.uid ?? "", { skip: !user });

  if (!user) return null;

  const total = (dividends ?? []).reduce((sum, dividend) => sum + dividend.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dividends</h1>
          <p className="text-muted-foreground">
            Dividend income from stocks — tracked separately from realized and unrealized P/L.
          </p>
        </div>
        <AddDividendDialog userId={user.uid} />
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Banknote className="size-4" />
            Total dividends earned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-semibold text-profit">{formatPKR(total)}</p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Dividends by symbol</h2>
        <Card>
          <CardContent className="pt-6">
            <DividendsBySymbolChart dividends={dividends ?? []} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">History</h2>
        <DividendsTable userId={user.uid} />
      </section>
    </div>
  );
}
