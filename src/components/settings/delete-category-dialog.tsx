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
import { useDeleteCategoryMutation } from "@/store/api/categoriesApi";

interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
}

/** Same confirm-before-delete pattern as DeleteStockDialog — a warning plus a checkbox that must be checked before the destructive action enables. */
export function DeleteCategoryDialog({ categoryId, categoryName }: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleteCategory, { isLoading }] = useDeleteCategoryMutation();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmed(false);
  }

  async function handleDelete() {
    if (!confirmed) return;
    try {
      await deleteCategory(categoryId).unwrap();
      toast.success(`Removed "${categoryName}"`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove type.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Remove ${categoryName}`}
          className="hover:cursor-pointer rounded-full p-0.5 hover:bg-background/50"
        >
          <Trash2 className="size-3" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{categoryName}&quot;?</DialogTitle>
          <DialogDescription>
            This permanently removes it from the shared type list — no one will be able to select
            it for new entries. Existing transactions already using it are unaffected and keep
            displaying it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 py-2">
          <Checkbox
            id="confirm-delete-category"
            checked={confirmed}
            onCheckedChange={(next) => setConfirmed(next === true)}
          />
          <Label htmlFor="confirm-delete-category" className="font-normal">
            I understand this will permanently delete this type.
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
      </DialogContent>
    </Dialog>
  );
}
