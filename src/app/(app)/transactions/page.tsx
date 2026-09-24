"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionHistoryTable } from "@/components/transactions/transaction-history-table";
import { useAppSelector } from "@/store/hooks";

export default function TransactionsPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground">
          A dated audit log of every buy and sell you&apos;ve ever recorded.
        </p>
      </div>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4">
          <TransactionHistoryTable userId={user.uid} assetClass="stock" />
        </TabsContent>
        <TabsContent value="crypto" className="mt-4">
          <TransactionHistoryTable userId={user.uid} assetClass="crypto" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
