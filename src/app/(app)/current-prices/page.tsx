"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { CurrentPricesTable } from "@/components/current-prices/current-prices-table";
import { SetPriceDialog } from "@/components/current-prices/set-price-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/store/hooks";

function CurrentPricesContent() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Current Prices</h1>
          <p className="text-muted-foreground">
            Manually entered market prices, shared across every user — an interim stopgap until
            an automated price feed exists.
          </p>
        </div>
        <SetPriceDialog userId={user.uid} defaultAssetClass="stock" />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <CurrentPricesTable userId={user.uid} assetClass="stock" />
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          <CurrentPricesTable userId={user.uid} assetClass="crypto" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CurrentPricesPage() {
  return (
    <RequireAdmin>
      <CurrentPricesContent />
    </RequireAdmin>
  );
}
