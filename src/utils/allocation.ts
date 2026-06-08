// ---------------------------------------------------------------------------
// Allocation strategies
// ---------------------------------------------------------------------------
// Two DCA allocation modes, kept as pure functions so the UI just renders the
// result. Both return a map of { symbol: dollarAmount }.
// ---------------------------------------------------------------------------

import { undervaluationScore } from './signals';
import type { QuotesMap, StrategyDefinition, StrategyKey } from '../types/stocks';

/**
 * Concentrate the monthly contribution on the most undervalued positions
 * (those trading meaningfully below their 50-day MA). If nothing qualifies,
 * everything gets 0 - a cue to hold cash or fall back to equal spread.
 */
export function allocateByUndervalued(
  portfolio: string[],
  quotes: QuotesMap,
  monthlyAmount: number
): Record<string, number> {
  const undervalued = portfolio
    .filter((symbol) => undervaluationScore(quotes[symbol]) > 5)
    .sort((a, b) => undervaluationScore(quotes[b]) - undervaluationScore(quotes[a]));

  const result: Record<string, number> = {};
  portfolio.forEach((symbol) => {
    result[symbol] = undervalued.includes(symbol) ? monthlyAmount / undervalued.length : 0;
  });
  return result;
}

/**
 * Spread the monthly contribution evenly across every holding - the classic,
 * emotion-free DCA approach.
 */
export function allocateEqually(
  portfolio: string[],
  _quotes: QuotesMap,
  monthlyAmount: number
): Record<string, number> {
  const result: Record<string, number> = {};
  const perPosition = portfolio.length ? monthlyAmount / portfolio.length : 0;
  portfolio.forEach((symbol) => {
    result[symbol] = perPosition;
  });
  return result;
}

export const STRATEGIES: Record<StrategyKey, StrategyDefinition> = {
  undervalued: {
    label: 'Most Undervalued',
    fn: allocateByUndervalued,
    description: 'Concentrate capital on the biggest dips.',
    detail:
      'Puts this month\'s money only into the holdings trading meaningfully below their 50-day average (5%+ below), splitting it evenly among them and ranking the cheapest first. This is a "buy the dip" tilt - you lean into weakness. If nothing is on sale, every position gets $0, a cue to hold cash or switch to Equal Spread.',
  },
  equal: {
    label: 'Equal Spread',
    fn: allocateEqually,
    description: 'Distribute evenly across all holdings.',
    detail:
      'Splits this month\'s money equally across every holding, regardless of price action. This is classic, emotion-free dollar-cost averaging - you always invest the full amount and never try to time the market.',
  },
};
