"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LotsTable } from "@/components/stocks/lots-table";
import { SoldTable } from "@/components/stocks/sold-table";
import { exportHoldingsPdf } from "@/lib/pdf/holdings-pdf";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";

interface HoldingsBrowserProps {
  userId: string;
  assetClass: AssetClass;
}

export function HoldingsBrowser({ userId, assetClass }: HoldingsBrowserProps) {
  const [tab, setTab] = useState<"active" | "sold">("active");
  const [search, setSearch] = useState("");
  const { data: transactions, isFetching } = useGetTransactionsQuery({ userId, assetClass });

  function handleDownload() {
    if (!transactions || transactions.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    exportHoldingsPdf(transactions, assetClass);
    toast.success("Holdings PDF downloaded");
  }

  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as "active" | "sold")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
        </TabsList>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by symbol or name"
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={isFetching || !transactions?.length}
            onClick={handleDownload}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </div>
      <TabsContent value="active" className="mt-4">
        <LotsTable userId={userId} assetClass={assetClass} searchQuery={search} />
      </TabsContent>
      <TabsContent value="sold" className="mt-4">
        <SoldTable userId={userId} assetClass={assetClass} searchQuery={search} />
      </TabsContent>
    </Tabs>
  );
}
