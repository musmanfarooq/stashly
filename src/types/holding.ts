import type { AssetClass } from "./transaction";

export type HoldingStatus = "active" | "partially_sold" | "sold";

export interface Holding {
  id: string;
  userId: string;
  assetClass: AssetClass;
  symbol: string;
  name: string;
  category: string;
  totalShares: number;
  avgBuyPrice: number;
  status: HoldingStatus;
  updatedAt: number;
}
