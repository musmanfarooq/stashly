import type { AssetClass } from "./transaction";

export interface CurrentPrice {
  id: string;
  symbol: string;
  assetClass: AssetClass;
  price: number;
  updatedAt: number;
  updatedBy: string;
}
