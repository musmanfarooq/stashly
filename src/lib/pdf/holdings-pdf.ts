import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AssetClass, Transaction } from "@/types/transaction";
import { assetNoun, assetUnitLabel } from "@/lib/asset-labels";

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

/** Exports the full current Holdings View (Active + Sold, per 2.7) — no date filter, always unfiltered by any on-screen search. */
export function exportHoldingsPdf(transactions: Transaction[], assetClass: AssetClass): void {
  const activeLots = transactions
    .filter((t) => t.action === "buy" && !t.locked && t.remainingShares > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const sells = transactions
    .filter((t) => t.action === "sell")
    .sort((a, b) => b.date.localeCompare(a.date));

  const doc = new jsPDF() as JsPdfWithAutoTable;
  const noun = assetNoun(assetClass);
  const unitLabel = assetUnitLabel(assetClass);

  doc.setFontSize(14);
  doc.text(`Holdings — ${noun}`, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`As of ${new Date().toISOString().slice(0, 10)}`, 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Active", 14, 32);
  autoTable(doc, {
    startY: 36,
    head: [["Symbol", "Name", "Type", unitLabel, "Buy price (PKR)", "Buy date"]],
    body: activeLots.map((lot) => [
      lot.symbol,
      lot.name,
      lot.category,
      String(lot.remainingShares),
      lot.price.toFixed(2),
      lot.date,
    ]),
  });

  const afterActiveY = doc.lastAutoTable?.finalY ?? 36;

  doc.setFontSize(12);
  doc.text("Sold", 14, afterActiveY + 10);
  autoTable(doc, {
    startY: afterActiveY + 14,
    head: [["Symbol", "Name", `${unitLabel} sold`, "Sell price (PKR)", "Sell date", "Realized P/L (PKR)"]],
    body: sells.map((sell) => [
      sell.symbol,
      sell.name,
      String(sell.shares),
      sell.price.toFixed(2),
      sell.date,
      (sell.realizedPL ?? 0).toFixed(2),
    ]),
  });

  doc.save(`holdings-${assetClass}.pdf`);
}
