export function formatPKR(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `PKR ${rounded.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}
