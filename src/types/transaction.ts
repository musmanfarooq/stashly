export type AssetClass = "stock" | "crypto";
export type TransactionAction = "buy" | "sell";

export interface Transaction {
  id: string;
  userId: string;
  assetClass: AssetClass;
  action: TransactionAction;
  symbol: string;
  name: string;
  category: string;
  /** Buy: shares originally purchased in this lot (immutable once any of it has been sold). Sell: shares sold in this action. */
  shares: number;
  /** Buy: shares still unsold from this lot (0 once fully consumed). Sell: unused, mirrors `shares`. */
  remainingShares: number;
  price: number;
  /** ISO date (YYYY-MM-DD) — buy date or sell date. */
  date: string;
  locked: boolean;
  realizedPL: number | null;
  /** The average cost per share used to compute this sell's realized P/L, frozen at the time of sale. */
  costBasisAtSale: number | null;
  createdAt: number;
  updatedAt: number;
}
