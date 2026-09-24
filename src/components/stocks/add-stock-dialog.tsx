"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "./category-select";
import { useAddBuyMutation } from "@/store/api/transactionsApi";
import type { AssetClass } from "@/types/transaction";
import {
  assetNamePlaceholder,
  assetNoun,
  assetSymbolPlaceholder,
  assetUnitLabel,
} from "@/lib/asset-labels";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddStockDialogProps {
  userId: string;
  assetClass: AssetClass;
}

export function AddStockDialog({ userId, assetClass }: AddStockDialogProps) {
  const noun = assetNoun(assetClass);
  const unitLabel = assetUnitLabel(assetClass);
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("");
  const [addBuy, { isLoading }] = useAddBuyMutation();

  const sharesValue = Number(shares);
  const priceValue = Number(price);
  const isValid =
    symbol.trim().length > 0 &&
    name.trim().length > 0 &&
    category.length > 0 &&
    sharesValue > 0 &&
    priceValue > 0 &&
    date.length > 0;

  function resetForm() {
    setSymbol("");
    setName("");
    setShares("");
    setPrice("");
    setDate(today());
    setCategory("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await addBuy({
        userId,
        assetClass,
        symbol,
        name,
        category,
        shares: sharesValue,
        price: priceValue,
        date,
      }).unwrap();
      toast.success(`Bought ${sharesValue} ${symbol.toUpperCase()}`);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add transaction.");
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
        <Button className="gap-2 bg-buy text-buy-foreground hover:bg-buy/80">
          <Plus className="size-4" />
          Add {noun}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add {noun}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-symbol">Symbol</Label>
              <Input
                id="add-symbol"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder={assetSymbolPlaceholder(assetClass)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={assetNamePlaceholder(assetClass)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-shares">{unitLabel}</Label>
                <Input
                  id="add-shares"
                  type="number"
                  min="0"
                  step="any"
                  value={shares}
                  onChange={(event) => setShares(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-price">Price per unit (PKR)</Label>
                <Input
                  id="add-price"
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
              <Label htmlFor="add-date">Buy date</Label>
              <Input
                id="add-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Type / category</Label>
              <CategorySelect userId={userId} value={category} onChange={setCategory} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="gap-2 bg-buy text-buy-foreground hover:bg-buy/80"
            >
              <Plus className="size-4" />
              {isLoading ? "Saving..." : `Add ${noun}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
