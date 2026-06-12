import type { MarketConfig } from './markets';

/**
 * Formats a value in the market's currency and locale. en-IN gives proper
 * lakh/crore digit grouping (e.g. ₹2,50,000) for free.
 */
export function formatCurrency(
  value: number,
  market: MarketConfig,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/** Currency with exactly two decimal places (per-share prices). */
export function formatPrice(value: number, market: MarketConfig): string {
  return formatCurrency(value, market, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
