import type { HistoryRange, HistoryResponse, QuoteResponseItem, QuotesMap } from '../types/stocks';

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------
// Thin wrapper around fetch() for the backend endpoints. In dev, Vite proxies
// /api -> http://localhost:3001 (see vite.config.ts). In production, serve the
// built frontend from the same Express server so the relative paths just work.
// ---------------------------------------------------------------------------

interface QuotesApiResponse {
  quotes: QuoteResponseItem[];
}

/**
 * Fetch current quotes for a list of symbols.
 */
export async function fetchQuotes(symbols: string[]): Promise<QuotesMap> {
  if (!symbols.length) return {};
  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
  if (!res.ok) throw new Error(`Quotes request failed: ${res.status}`);
  const payload = (await res.json()) as QuotesApiResponse;

  // Normalize into a lookup map keyed by symbol.
  const map: QuotesMap = {};
  for (const q of payload.quotes) map[q.symbol] = q;
  return map;
}

/**
 * Fetch historical daily closes for a single symbol.
 */
export async function fetchHistory(symbol: string, range: HistoryRange = '1y'): Promise<HistoryResponse> {
  const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
  if (!res.ok) throw new Error(`History request failed: ${res.status}`);
  return (await res.json()) as HistoryResponse;
}
