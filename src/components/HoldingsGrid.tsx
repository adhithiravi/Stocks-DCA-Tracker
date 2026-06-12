import { useState } from 'react';
import { getBuySignals } from '../utils/signals';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../utils/format';
import type { QuotesMap } from '../types/stocks';

interface HoldingsGridProps {
  portfolio: string[];
  quotes: QuotesMap;
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

/**
 * Shows every holding as a compact card, with a control to add new tickers.
 * Add is handled locally for the input field; the parent owns the portfolio.
 */
export default function HoldingsGrid({
  portfolio,
  quotes,
  onAdd,
  onRemove,
  onSelect,
}: HoldingsGridProps) {
  const { market } = useMarket();
  const [newTicker, setNewTicker] = useState('');

  const handleAdd = () => {
    onAdd(newTicker);
    setNewTicker('');
  };

  return (
    <div className="section">
      <div className="section-head">
        <h2>All holdings</h2>
        <span className="section-pill">
          {portfolio.length} {portfolio.length === 1 ? 'asset' : 'assets'}
        </span>
      </div>

      <div className="holdings-grid">
        {portfolio.map((symbol) => {
          const data = quotes[symbol];
          const signals = getBuySignals(data);
          return (
            <div
              role="button"
              tabIndex={0}
              className={`holding-card clickable${signals ? ' signal' : ''}`}
              key={symbol}
              onClick={() => onSelect(symbol)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(symbol)}
              title={`View ${symbol} price chart`}
            >
              <button
                type="button"
                className="holding-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(symbol);
                }}
                aria-label={`Remove ${symbol}`}
                title={`Remove ${symbol}`}
              >
                &#10005;
              </button>
              <div className="holding-ticker">{symbol}</div>
              {data && !('error' in data) && data.price != null ? (
                <>
                  <div className="holding-price">{formatCurrency(data.price, market)}</div>
                  <div className={`holding-change ${(data.change ?? 0) < 0 ? 'negative' : 'positive'}`}>
                    {(data.change ?? 0) > 0 ? '\u2191' : '\u2193'} {Math.abs(data.change ?? 0).toFixed(1)}%
                  </div>
                </>
              ) : (
                <div className="holding-change">&mdash;</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="add-input-group">
        <input
          type="text"
          placeholder={market.tickerPlaceholder}
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button type="button" onClick={handleAdd}>
          + Add stock
        </button>
      </div>
    </div>
  );
}
