import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AssetClass, Transaction } from "@/types/transaction";
import { assetNoun, assetUnitLabel } from "@/lib/asset-labels";

/**
 * Client-side generation: no Cloud Function/backend infra exists in this
 * project yet, and a personal-portfolio-scale export won't meaningfully
 * block the UI thread, so this is the pragmatic default per 2.9.
 */
export function exportTransactionHistoryPdf(
  transactions: Transaction[],
  assetClass: AssetClass,
  upToDate?: string,
): void {
  const filtered = upToDate ? transactions.filter((t) => t.date <= upToDate) : transactions;
  const sorted = [...filtered].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
  );

  const doc = new jsPDF();
  const noun = assetNoun(assetClass);
  const unitLabel = assetUnitLabel(assetClass);

  doc.setFontSize(14);
  doc.text(`Transaction History — ${noun}`, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    upToDate ? `Transactions up to and including ${upToDate}` : "All transactions",
    14,
    22,
  );

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Symbol", "Action", unitLabel, "Price (PKR)", "Realized P/L (PKR)"]],
    body: sorted.map((t) => [
      t.date,
      t.symbol,
      t.action === "buy" ? "Buy" : "Sell",
      String(t.shares),
      t.price.toFixed(2),
      t.action === "sell" && t.realizedPL !== null ? t.realizedPL.toFixed(2) : "—",
    ]),
  });

  const suffix = upToDate ? `-through-${upToDate}` : "";
  doc.save(`transaction-history-${assetClass}${suffix}.pdf`);
}
