import { useState, useEffect, useCallback } from 'react';
import { useMarket } from '../context/MarketContext';
import { MARKETS, type MarketKey } from '../utils/markets';

const LEGACY_STORAGE_KEY = 'dca_portfolio';

function storageKeyFor(marketKey: MarketKey): string {
  return `dca_portfolio_${marketKey}`;
}

function readPortfolio(marketKey: MarketKey): string[] {
  try {
    const saved = localStorage.getItem(storageKeyFor(marketKey));
    if (saved) return JSON.parse(saved) as string[];

    // Portfolios saved before markets existed were all US.
    if (marketKey === 'us') {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) return JSON.parse(legacy) as string[];
    }
  } catch {
    // fall through to defaults
  }
  return MARKETS[marketKey].defaultPortfolio;
}

interface PortfolioState {
  marketKey: MarketKey;
  list: string[];
}

/**
 * Manages the list of held symbols for the active market. Each market keeps
 * its own localStorage entry, so toggling US <-> India never clobbers the
 * other portfolio.
 */
export function usePortfolio() {
  const { marketKey, market } = useMarket();
  const [state, setState] = useState<PortfolioState>(() => ({
    marketKey,
    list: readPortfolio(marketKey),
  }));

  // Swap to the other market's saved list when the toggle changes.
  useEffect(() => {
    setState((prev) =>
      prev.marketKey === marketKey ? prev : { marketKey, list: readPortfolio(marketKey) }
    );
  }, [marketKey]);

  useEffect(() => {
    // Guard against persisting a stale list under the new market's key during
    // the one render between a market switch and the reload effect above.
    if (state.marketKey !== marketKey) return;
    localStorage.setItem(storageKeyFor(state.marketKey), JSON.stringify(state.list));
  }, [state, marketKey]);

  const addSymbol = useCallback(
    (symbol: string) => {
      let ticker = symbol.trim().toUpperCase();
      if (!ticker) return;
      // Indian users typically type bare NSE tickers (WIPRO); Yahoo needs WIPRO.NS.
      if (market.symbolSuffix && !ticker.includes('.')) ticker += market.symbolSuffix;
      setState((prev) =>
        prev.list.includes(ticker) ? prev : { ...prev, list: [...prev.list, ticker] }
      );
    },
    [market.symbolSuffix]
  );

  const removeSymbol = useCallback((symbol: string) => {
    setState((prev) => ({ ...prev, list: prev.list.filter((s) => s !== symbol) }));
  }, []);

  const reset = useCallback(
    () => setState((prev) => ({ ...prev, list: market.defaultPortfolio })),
    [market.defaultPortfolio]
  );

  return { portfolio: state.list, addSymbol, removeSymbol, reset };
}
