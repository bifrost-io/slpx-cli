/** True when `amount` parses to a finite number strictly greater than zero. */
export function isPositiveAmount(amount: string): boolean {
  const n = Number.parseFloat(amount);
  return !Number.isNaN(n) && n > 0;
}
