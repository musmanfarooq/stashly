"use client";

import { AddStockDialog } from "@/components/stocks/add-stock-dialog";
import { PositionsSection } from "@/components/stocks/positions-section";
import { useAppSelector } from "@/store/hooks";

export default function CryptoPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Crypto</h1>
          <p className="text-muted-foreground">
            Track your crypto purchases, sales, and average cost basis.
          </p>
        </div>
        <AddStockDialog userId={user.uid} assetClass="crypto" />
      </div>

      <PositionsSection userId={user.uid} assetClass="crypto" />
    </div>
  );
}
