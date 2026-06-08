import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PORTFOLIO } from '../utils/constants';

const STORAGE_KEY = 'dca_portfolio';

/**
 * Manages the list of held symbols, persisting it to localStorage so the
 * user's portfolio survives page reloads.
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : DEFAULT_PORTFOLIO;
    } catch {
      return DEFAULT_PORTFOLIO;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const addSymbol = useCallback((symbol: string) => {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) return;
    setPortfolio((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]));
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setPortfolio((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const reset = useCallback(() => setPortfolio(DEFAULT_PORTFOLIO), []);

  return { portfolio, addSymbol, removeSymbol, reset };
}
