"use client";

import { useState, type FormEvent } from "react";
import { TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSellSharesMutation } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import { assetUnitLabel } from "@/lib/asset-labels";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SellStockDialogProps {
  userId: string;
  assetClass: AssetClass;
  symbol: string;
  availableShares: number;
  avgCost: number;
}

export function SellStockDialog({
  userId,
  assetClass,
  symbol,
  availableShares,
  avgCost,
}: SellStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [sellShares, { isLoading }] = useSellSharesMutation();

  const sharesValue = Number(shares);
  const priceValue = Number(price);
  const isValid =
    sharesValue > 0 && sharesValue <= availableShares && priceValue > 0 && date.length > 0;

  const estimatedPL = isValid ? (priceValue - avgCost) * sharesValue : null;

  function resetForm() {
    setShares("");
    setPrice("");
    setDate(today());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await sellShares({
        userId,
        assetClass,
        symbol,
        shares: sharesValue,
        price: priceValue,
        date,
      }).unwrap();
      toast.success(`Sold ${sharesValue} ${symbol}`);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sell shares.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-sell text-sell-foreground hover:bg-sell/80"
          disabled={availableShares <= 0}
        >
          <TrendingDown className="size-4" />
          Sell
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Sell {symbol}</DialogTitle>
            <DialogDescription>
              {availableShares} {assetUnitLabel(assetClass).toLowerCase()} held at an average cost
              of PKR {avgCost.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sell-shares">{assetUnitLabel(assetClass)} to sell</Label>
                <Input
                  id="sell-shares"
                  type="number"
                  min="0"
                  max={availableShares}
                  step="any"
                  value={shares}
                  onChange={(event) => setShares(event.target.value)}
                  required
                />
                {sharesValue > availableShares && (
                  <p className="text-xs text-destructive">
                    Cannot sell more than the {availableShares}{" "}
                    {assetUnitLabel(assetClass).toLowerCase()} held.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sell-price">Sell price per unit (PKR)</Label>
                <Input
                  id="sell-price"
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sell-date">Sell date</Label>
              <Input
                id="sell-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            {estimatedPL !== null && (
              <p className="text-sm">
                Estimated realized P/L:{" "}
                <span className={estimatedPL >= 0 ? "text-profit" : "text-loss"}>
                  PKR {estimatedPL.toFixed(2)}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="gap-2 bg-sell text-sell-foreground hover:bg-sell/80"
            >
              <TrendingDown className="size-4" />
              {isLoading ? "Selling..." : "Confirm sell"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
