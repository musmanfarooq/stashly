"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
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
import { useEditBuyMutation } from "@/store/api/transactionsApi";
import type { Transaction } from "@/types/transaction";
import { assetNativeCurrency, assetUnitLabel } from "@/lib/asset-labels";

interface EditStockDialogProps {
  userId: string;
  transaction: Transaction;
}

export function EditStockDialog({ userId, transaction }: EditStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(transaction.name);
  const [price, setPrice] = useState(String(transaction.price));
  const [date, setDate] = useState(transaction.date);
  const [category, setCategory] = useState(transaction.category);
  const [editBuy, { isLoading }] = useEditBuyMutation();

  const priceValue = Number(price);
  const isValid = name.trim().length > 0 && category.length > 0 && priceValue > 0 && date.length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await editBuy({
        id: transaction.id,
        userId,
        assetClass: transaction.assetClass,
        symbol: transaction.symbol,
        name,
        category,
        shares: transaction.shares,
        price: priceValue,
        date,
      }).unwrap();
      toast.success("Transaction updated");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update transaction.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Edit transaction">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit buy transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-symbol">Symbol</Label>
              <Input id="edit-symbol" value={transaction.symbol} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-shares">{assetUnitLabel(transaction.assetClass)}</Label>
                <Input id="edit-shares" type="number" value={transaction.shares} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">
                  Price per unit ({assetNativeCurrency(transaction.assetClass)})
                </Label>
                <Input
                  id="edit-price"
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
              <Label htmlFor="edit-date">Buy date</Label>
              <Input
                id="edit-date"
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
            <Button type="submit" disabled={!isValid || isLoading} className="gap-2">
              <Pencil className="size-4" />
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
