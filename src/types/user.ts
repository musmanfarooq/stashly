import type { CurrencyCode } from "@/lib/currency";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  currency: CurrencyCode;
  canDeleteHoldings: boolean;
  lastLoginAt: number;
  createdAt: number;
}
