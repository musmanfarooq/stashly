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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeEverBoughtSymbols } from "@/lib/portfolio-stats";
import { useAddDividendMutation } from "@/store/api/dividendsApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddDividendDialogProps {
  userId: string;
}

export function AddDividendDialog({ userId }: AddDividendDialogProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const { data: stockTransactions } = useGetTransactionsQuery({ userId, assetClass: "stock" });
  const [addDividend, { isLoading }] = useAddDividendMutation();

  const symbols = computeEverBoughtSymbols(stockTransactions ?? []);
  const amountValue = Number(amount);
  const isValid = symbol.length > 0 && amountValue > 0 && date.length > 0;

  function resetForm() {
    setSymbol("");
    setAmount("");
    setDate(today());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      await addDividend({ userId, symbol, amount: amountValue, date }).unwrap();
      toast.success(`Added dividend for ${symbol}`);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add dividend.");
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
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Dividend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add dividend</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      symbols.length === 0 ? "No stocks bought yet" : "Select a stock"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map((entry) => (
                    <SelectItem key={entry.symbol} value={entry.symbol}>
                      {entry.symbol} — {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dividend-amount">Amount received (PKR)</Label>
              <Input
                id="dividend-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dividend-date">Date received</Label>
              <Input
                id="dividend-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isValid || isLoading} className="gap-2">
              <Plus className="size-4" />
              {isLoading ? "Saving..." : "Add Dividend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
