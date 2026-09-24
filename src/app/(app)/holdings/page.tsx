"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoldingsBrowser } from "@/components/holdings/holdings-browser";
import { useAppSelector } from "@/store/hooks";

export default function HoldingsPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Holdings</h1>
        <p className="text-muted-foreground">
          Browse your current and past positions, lot by lot.
        </p>
      </div>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <HoldingsBrowser userId={user.uid} assetClass="stock" />
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          <HoldingsBrowser userId={user.uid} assetClass="crypto" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
