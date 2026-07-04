export function formatCurrency(value: number | null | undefined, symbol: string): string {
  return `${symbol}${(value ?? 0).toFixed(2)}`;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  return (value ?? 0).toFixed(digits);
}
