import type { CurrencyCode } from "@/lib/currency";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  currency: CurrencyCode;
  lastLoginAt: number;
  createdAt: number;
}
