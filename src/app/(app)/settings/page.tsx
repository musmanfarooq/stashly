"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteCategoryDialog } from "@/components/settings/delete-category-dialog";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { updateUserCanDeleteHoldings, updateUserCurrency } from "@/services/firebase/users";
import { setUser } from "@/features/auth/authSlice";
import { useAddCategoryMutation, useGetCategoriesQuery } from "@/store/api/categoriesApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDeleteAccess, setIsSavingDeleteAccess] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const { data: categories = [] } = useGetCategoriesQuery(undefined, { skip: !user?.isAdmin });
  const [addCategory, { isLoading: isAddingType }] = useAddCategoryMutation();

  if (!user) return null;

  async function handleCurrencyChange(next: string) {
    if (!user) return;
    const currency = next as CurrencyCode;
    setIsSaving(true);
    try {
      await updateUserCurrency(user.uid, currency);
      dispatch(setUser({ ...user, currency }));
      toast.success(`Display currency changed to ${currency}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update currency.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCanDeleteHoldingsChange(next: boolean) {
    if (!user) return;
    setIsSavingDeleteAccess(true);
    try {
      await updateUserCanDeleteHoldings(user.uid, next);
      dispatch(setUser({ ...user, canDeleteHoldings: next }));
      toast.success(next ? "Delete access enabled" : "Delete access disabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update setting.");
    } finally {
      setIsSavingDeleteAccess(false);
    }
  }

  async function handleAddType() {
    if (!user || !newTypeName.trim()) return;
    try {
      await addCategory({ createdBy: user.uid, name: newTypeName }).unwrap();
      toast.success(`Added "${newTypeName.trim()}"`);
      setNewTypeName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add type.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Display currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select value={user.currency} onValueChange={handleCurrencyChange} disabled={isSaving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {CURRENCY_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            This only affects stocks — they&apos;re recorded in PKR and shown here converted to
            your chosen currency using a daily exchange rate. Crypto is always recorded and shown
            in USD, unaffected by this setting. Nothing about how your data is stored changes.
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Delete access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id="can-delete-holdings"
              checked={user.canDeleteHoldings}
              onCheckedChange={(next) => handleCanDeleteHoldingsChange(next === true)}
              disabled={isSavingDeleteAccess}
            />
            <Label htmlFor="can-delete-holdings" className="font-normal">
              Allow deleting entries
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, you can permanently delete a stock or crypto entry from the Holdings
            page — only ones you haven&apos;t sold any shares from. Entries with any sell history
            can never be deleted.
          </p>
        </CardContent>
      </Card>

      {user.isAdmin && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Manage types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category.id} variant="secondary" className="gap-1 pr-1">
                  {category.name}
                  <DeleteCategoryDialog categoryId={category.id} categoryName={category.name} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New type name"
                value={newTypeName}
                onChange={(event) => setNewTypeName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddType();
                  }
                }}
              />
              <Button type="button" onClick={handleAddType} disabled={isAddingType || !newTypeName.trim()}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
