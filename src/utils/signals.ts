import type { QuoteResponseItem } from '../types/stocks';

// ---------------------------------------------------------------------------
// Buy-signal logic
// ---------------------------------------------------------------------------
// Pure functions with no React dependency, so they are easy to unit-test and
// reason about. These encode the "expert investor" dip heuristics chosen for a
// 10-20 year DCA strategy.
// ---------------------------------------------------------------------------

function isQuoteData(data: QuoteResponseItem | undefined): data is Exclude<QuoteResponseItem, { error: string }> {
  return !!data && !('error' in data);
}

/**
 * Returns an array of human-readable buy signals for a stock, or null if none.
 */
export function getBuySignals(data: QuoteResponseItem | undefined): string[] | null {
  if (!isQuoteData(data) || data.price == null) return null;

  const signals: string[] = [];

  // 1. Trading >15% below the 200-day moving average (deep value vs. trend).
  //    Falls back to an estimate from the 50-day MA if 200-day is missing.
  const ma200 = data.ma200 ?? (data.ma50 != null ? data.ma50 * 1.05 : null);
  if (ma200 != null && data.price < ma200 * 0.85) {
    signals.push('>15% below 200-day moving average');
  }

  // 2. Near the 52-week low (within 5%) - significant undervaluation.
  if (data.low52 != null && data.price < data.low52 * 1.05) {
    signals.push('Near 52-week low');
  }

  // 3. Sharp recent drop - possible market overreaction / panic.
  if (data.change != null && Math.abs(data.change) > 15 && data.change < 0) {
    signals.push(`High volatility (${Math.abs(data.change).toFixed(1)}% down)`);
  }

  return signals.length > 0 ? signals : null;
}

/**
 * Undervaluation score: how far below its 50-day MA a stock trades, as a
 * percentage. Higher = cheaper relative to its recent trend. Used to rank
 * which positions to fund first in "most undervalued" allocation mode.
 */
export function undervaluationScore(data: QuoteResponseItem | undefined): number {
  if (!isQuoteData(data) || data.price == null || !data.ma50) return 0;
  return Math.max(0, 100 - (data.price / data.ma50) * 100);
}
