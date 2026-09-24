"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PositionsTable } from "@/components/stocks/positions-table";
import type { AssetClass } from "@/types/transaction";

interface PositionsSectionProps {
  userId: string;
  assetClass: AssetClass;
}

export function PositionsSection({ userId, assetClass }: PositionsSectionProps) {
  const [search, setSearch] = useState("");

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">Positions</h2>
        <div className="relative sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by symbol or name"
            className="pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <PositionsTable userId={userId} assetClass={assetClass} searchQuery={search} />
    </section>
  );
}
