/** Format a number with thousands separators, e.g. 1200 -> "1,200". */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Format a price with the currency symbol, e.g. "Rs 1,200". */
export function money(amount: number, symbol = 'Rs'): string {
  return `${symbol} ${formatNumber(amount)}`;
}
