"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSetCurrentPriceMutation } from "@/store/api/currentPricesApi";
import type { AssetClass } from "@/types/transaction";

interface SetPriceDialogProps {
  userId: string;
  defaultAssetClass: AssetClass;
}

export function SetPriceDialog({ userId, defaultAssetClass }: SetPriceDialogProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass>(defaultAssetClass);
  const [price, setPrice] = useState("");
  const [setCurrentPrice, { isLoading }] = useSetCurrentPriceMutation();

  const priceValue = Number(price);
  const isValid = symbol.trim().length > 0 && priceValue > 0;

  function resetForm() {
    setSymbol("");
    setPrice("");
    setAssetClass(defaultAssetClass);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await setCurrentPrice({ symbol, assetClass, price: priceValue, updatedBy: userId }).unwrap();
      toast.success(`Set price for ${symbol.toUpperCase()}`);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set price.");
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
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" />
          Set price for a symbol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Set current price</DialogTitle>
            <DialogDescription>
              Useful for pricing a symbol you don&apos;t personally hold — the price is shared
              with every user regardless.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="price-symbol">Symbol</Label>
              <Input
                id="price-symbol"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="e.g. OGDC"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Asset class</Label>
              <Select value={assetClass} onValueChange={(next) => setAssetClass(next as AssetClass)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-value">Current price (PKR)</Label>
              <Input
                id="price-value"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isValid || isLoading} className="gap-2">
              <Plus className="size-4" />
              {isLoading ? "Saving..." : "Save price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
