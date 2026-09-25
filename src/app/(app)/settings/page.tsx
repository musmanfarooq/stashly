"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { updateUserCurrency } from "@/services/firebase/users";
import { setUser } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);

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
    </div>
  );
}
