export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatPeriodLabel(periodStr: string): string {
  const [year, month] = periodStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(periodStr: string): number {
  const [year, month] = periodStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}
