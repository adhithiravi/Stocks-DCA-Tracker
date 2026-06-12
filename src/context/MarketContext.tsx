import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_MARKET_KEY, MARKETS, isMarketKey, type MarketConfig, type MarketKey } from '../utils/markets';

const STORAGE_KEY = 'dca_market';

interface MarketContextValue {
  marketKey: MarketKey;
  market: MarketConfig;
  setMarketKey: (key: MarketKey) => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

/**
 * Holds the selected market (US or India), persisted to localStorage so the
 * choice survives reloads. Everything market-specific (default holdings,
 * currency, visible tabs) derives from this.
 */
export function MarketProvider({ children }: { children: ReactNode }) {
  const [marketKey, setMarketKey] = useState<MarketKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return isMarketKey(saved) ? saved : DEFAULT_MARKET_KEY;
    } catch {
      return DEFAULT_MARKET_KEY;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, marketKey);
  }, [marketKey]);

  const value = useMemo<MarketContextValue>(
    () => ({ marketKey, market: MARKETS[marketKey], setMarketKey }),
    [marketKey]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within a MarketProvider');
  return ctx;
}
