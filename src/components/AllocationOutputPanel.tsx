import { STRATEGIES } from '../utils/allocation';
import { getBuySignals } from '../utils/signals';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../utils/format';
import type { MarketConfig } from '../utils/markets';
import type { QuotesMap, StrategyKey } from '../types/stocks';

interface AllocationOutputPanelProps {
  portfolio: string[];
  quotes: QuotesMap;
  monthlyAmount: number;
  strategy: StrategyKey;
  onSelect: (symbol: string) => void;
}

function formatMoney(amount: number, market: MarketConfig): string {
  const digits = amount < 100 ? 2 : 0;
  return formatCurrency(amount, market, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Actionable buy list for the current month from selected strategy settings.
 */
export default function AllocationOutputPanel({
  portfolio,
  quotes,
  monthlyAmount,
  strategy,
  onSelect,
}: AllocationOutputPanelProps) {
  const { market } = useMarket();
  const allocations = STRATEGIES[strategy].fn(portfolio, quotes, monthlyAmount);
  const rows = Object.entries(allocations).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const fundedCount = rows.filter(([, amount]) => amount > 0).length;
  const allocatedTotal = rows.reduce((sum, [, amount]) => sum + amount, 0);
  const remainingCash = Math.max(0, monthlyAmount - allocatedTotal);

  return (
    <section className="section">
      <div className="section-head">
        <h2>Allocation output</h2>
        <span className="section-pill">Actionable buys</span>
      </div>

      {!rows.length ? (
        <p className="empty-note">Add holdings to generate this month&apos;s buy list.</p>
      ) : (
        <>
          <div className="allocation-summary-bar">
            <span>
              Strategy: <strong>{STRATEGIES[strategy].label}</strong>
            </span>
            <span>
              Funded: <strong>{fundedCount}</strong> / <strong>{rows.length}</strong>
            </span>
            <span>
              Allocated: <strong>{formatMoney(allocatedTotal, market)}</strong>
            </span>
            <span>
              Remaining cash: <strong>{formatMoney(remainingCash, market)}</strong>
            </span>
          </div>

          {strategy === 'undervalued' && fundedCount === 0 && (
            <p className="allocation-empty-tip">
              No holdings currently meet the undervalued threshold. Switch to Equal Spread if you want
              to deploy all cash this month.
            </p>
          )}

          <div className="allocation-grid">
            {rows.map(([symbol, amount]) => {
              const hasSignal = Boolean(getBuySignals(quotes[symbol]));
              return (
                <button
                  type="button"
                  className={`allocation-card clickable${hasSignal ? ' signal' : ''}${
                    amount <= 0 ? ' is-zero' : ''
                  }`}
                  key={symbol}
                  onClick={() => onSelect(symbol)}
                  title={`View ${symbol} price chart`}
                >
                  <div className="allocation-ticker">{symbol}</div>
                  <div className="allocation-amount">{formatMoney(amount, market)}</div>
                  {hasSignal && <div className="signal-badge">BUY SIGNAL</div>}
                  {amount <= 0 && <div className="allocation-zero-note">No buy this month</div>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
