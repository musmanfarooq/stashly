"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDeleteBuyMutation } from "@/store/api/transactionsApi";
import { useAppSelector } from "@/store/hooks";
import type { Transaction } from "@/types/transaction";

interface DeleteStockDialogProps {
  userId: string;
  transaction: Transaction;
}

/**
 * Only ever rendered by the caller for a lot with remainingShares === shares
 * (never touched by a sell) — this dialog itself doesn't re-check that, it
 * just gates on the user's own canDeleteHoldings setting (enforced for real
 * server-side by the Firestore rule, this is just the matching UI).
 */
export function DeleteStockDialog({ userId, transaction }: DeleteStockDialogProps) {
  const canDelete = useAppSelector((state) => state.auth.user?.canDeleteHoldings ?? false);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleteBuy, { isLoading }] = useDeleteBuyMutation();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmed(false);
  }

  async function handleDelete() {
    if (!confirmed) return;
    try {
      await deleteBuy({ id: transaction.id, userId, assetClass: transaction.assetClass }).unwrap();
      toast.success(`Deleted ${transaction.symbol}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Delete transaction">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {canDelete ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete {transaction.symbol}?</DialogTitle>
              <DialogDescription>
                This permanently deletes this buy lot from your records. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-2 py-2">
              <Checkbox
                id="confirm-delete"
                checked={confirmed}
                onCheckedChange={(next) => setConfirmed(next === true)}
              />
              <Label htmlFor="confirm-delete" className="font-normal">
                I understand this will permanently delete this entry.
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                disabled={!confirmed || isLoading}
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Delete access is off</DialogTitle>
              <DialogDescription>
                Enable &quot;Allow deleting entries&quot; in Settings before you can delete a
                stock or crypto entry.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Got it
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
