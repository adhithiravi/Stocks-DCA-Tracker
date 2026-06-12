import { getBuySignals } from '../utils/signals';
import { useMarket } from '../context/MarketContext';
import { formatCurrency, formatPrice } from '../utils/format';
import type { QuotesMap } from '../types/stocks';

interface DipOpportunitiesProps {
  portfolio: string[];
  quotes: QuotesMap;
  onRemove: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

/**
 * Lists every holding that currently has at least one buy signal, sorted by
 * the steepest drop first. Each row shows price, moving average, 52-week range,
 * and the specific signals that fired.
 */
export default function DipOpportunities({
  portfolio,
  quotes,
  onRemove,
  onSelect,
}: DipOpportunitiesProps) {
  const { market } = useMarket();
  const dips = portfolio
    .filter((symbol) => getBuySignals(quotes[symbol]))
    .sort((a, b) => {
      const left = quotes[a];
      const right = quotes[b];
      const leftChange = left && !('error' in left) ? (left.change ?? 0) : 0;
      const rightChange = right && !('error' in right) ? (right.change ?? 0) : 0;
      return leftChange - rightChange;
    });

  return (
    <div className="section">
      <div className="section-head">
        <h2>Dip opportunities</h2>
        <span className="section-pill">
          {dips.length} active {dips.length === 1 ? 'signal' : 'signals'}
        </span>
      </div>
      {dips.length === 0 ? (
        <p className="empty-note">
          No dip opportunities right now. Stay disciplined with your regular DCA.
        </p>
      ) : (
        <div className="dip-list">
          {dips.map((symbol) => {
            const data = quotes[symbol];
            if (!data || 'error' in data) return null;
            const signals = getBuySignals(data);
            const changeClass = (data.change ?? 0) < -10 ? 'negative' : 'warn';
            return (
              <div className="dip-item" key={symbol}>
                <div className="dip-info">
                  <div className="dip-ticker">
                    <button
                      type="button"
                      className="dip-ticker-btn"
                      onClick={() => onSelect(symbol)}
                      title={`View ${symbol} price chart`}
                    >
                      {symbol}
                    </button>
                    <span className={`dip-change ${changeClass}`}>
                      &#8595; {Math.abs(data.change ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="dip-details">
                    <span>{data.price != null ? formatPrice(data.price, market) : '\u2014'}</span>
                    {data.ma50 != null && <span>MA50: {formatPrice(data.ma50, market)}</span>}
                    {data.low52 != null && data.high52 != null && (
                      <span>
                        52W: {formatCurrency(data.low52, market)}&ndash;{formatCurrency(data.high52, market)}
                      </span>
                    )}
                  </div>
                  <div className="dip-signals">
                    {signals?.map((s) => (
                      <div key={s}>&#10003; {s}</div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="dip-remove"
                  onClick={() => onRemove(symbol)}
                  aria-label={`Remove ${symbol}`}
                >
                  &#10005;
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
