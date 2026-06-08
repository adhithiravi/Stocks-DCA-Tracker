import type { QuotesMap } from '../types/stocks';
import { undervaluationScore } from './signals';

export type ValuationRegime = 'Cheap' | 'Fair' | 'Expensive' | 'Unavailable';

export interface ValuationRegimeResult {
  regime: ValuationRegime;
  averageScore: number | null;
  sampleSize: number;
  detail: string;
}

const CHEAP_THRESHOLD = 8;
const FAIR_THRESHOLD = 3;

export function getValuationRegime(portfolio: string[], quotes: QuotesMap): ValuationRegimeResult {
  const scores = portfolio
    .map((symbol) => undervaluationScore(quotes[symbol]))
    .filter((score) => Number.isFinite(score) && score > 0);

  if (!scores.length) {
    return {
      regime: 'Unavailable',
      averageScore: null,
      sampleSize: 0,
      detail:
        'No qualifying data yet. Regime appears after prices and 50-day averages are available.',
    };
  }

  const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  if (avg >= CHEAP_THRESHOLD) {
    return {
      regime: 'Cheap',
      averageScore: avg,
      sampleSize: scores.length,
      detail: `Average undervaluation score is ${avg.toFixed(1)} across ${scores.length} holdings.`,
    };
  }
  if (avg >= FAIR_THRESHOLD) {
    return {
      regime: 'Fair',
      averageScore: avg,
      sampleSize: scores.length,
      detail: `Average undervaluation score is ${avg.toFixed(1)} across ${scores.length} holdings.`,
    };
  }

  return {
    regime: 'Expensive',
    averageScore: avg,
    sampleSize: scores.length,
    detail: `Average undervaluation score is ${avg.toFixed(1)} across ${scores.length} holdings.`,
  };
}
