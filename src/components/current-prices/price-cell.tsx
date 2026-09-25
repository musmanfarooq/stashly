"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetCurrentPriceMutation } from "@/store/api/currentPricesApi";
import type { AssetClass } from "@/types/transaction";

interface PriceCellProps {
  symbol: string;
  assetClass: AssetClass;
  currentPrice: number | null;
  updatedBy: string;
}

export function PriceCell({ symbol, assetClass, currentPrice, updatedBy }: PriceCellProps) {
  const [value, setValue] = useState(currentPrice !== null ? String(currentPrice) : "");
  const [setCurrentPrice, { isLoading }] = useSetCurrentPriceMutation();

  const numericValue = Number(value);
  const isValid = numericValue > 0;
  const isUnchanged = currentPrice !== null && numericValue === currentPrice;

  async function handleSave() {
    if (!isValid) return;
    try {
      await setCurrentPrice({ symbol, assetClass, price: numericValue, updatedBy }).unwrap();
      toast.success(`Updated ${symbol} price`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update price.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-28"
        placeholder="Not set"
      />
      <Button
        type="button"
        className="hover:cursor-pointer"
        size="icon-sm"
        variant="outline"
        disabled={!isValid || isUnchanged || isLoading}
        onClick={handleSave}
        aria-label={`Save price for ${symbol}`}
      >
        <Save className="size-4" />
      </Button>
    </div>
  );
}
