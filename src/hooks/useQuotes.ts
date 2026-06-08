import { useState, useEffect, useCallback } from 'react';
import { fetchQuotes } from '../api/stocks';
import type { QuotesMap } from '../types/stocks';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches live quotes for the given symbols and exposes loading/error state.
 * Re-fetches whenever the symbol list changes, polls hourly to keep prices
 * current, and offers a manual refresh.
 */
export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<QuotesMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!symbols.length) {
      setQuotes({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuotes(symbols);
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    void load();
    if (!symbols.length) return;
    const id = setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, symbols.length]);

  return { quotes, loading, error, refresh: load };
}
