/**
 * Formats a number as currency (e.g., 12,500.00 SAR)
 */
export function formatCurrency(amount: number, symbol: string = 'SAR'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

  return `${formatted} ${symbol}`;
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
