import dayjs from 'dayjs';

export function formatCurrency(value: number | null | undefined, symbol: string): string {
  return `${symbol}${(value ?? 0).toFixed(2)}`;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  return (value ?? 0).toFixed(digits);
}

export function formatDate(date: any): string {
  if (!date) return '';
  return dayjs(date).format('DD MM YYYY HH:mm:ss');
}
