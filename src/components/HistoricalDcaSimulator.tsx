import { useEffect, useMemo, useState } from 'react';
import { fetchHistory } from '../api/stocks';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../utils/format';
import type { HistoryPoint, QuoteResponseItem, QuotesMap } from '../types/stocks';

interface HistoricalDcaSimulatorProps {
  portfolio: string[];
  quotes: QuotesMap;
}

interface PositionSimulation {
  symbol: string;
  invested: number;
  value: number;
  shares: number;
  returnPct: number;
}

const MIN_YEARS = 1;
const MAX_YEARS = 5;

function getMonthPrice(series: HistoryPoint[], year: number, month: number): number | null {
  const monthStart = new Date(year, month, 1).getTime();
  const nextMonthStart = new Date(year, month + 1, 1).getTime();

  for (const point of series) {
    const ts = new Date(point.date).getTime();
    if (ts >= monthStart && ts < nextMonthStart) return point.close;
  }

  // Fallback: use the latest known close before month end.
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const ts = new Date(series[i].date).getTime();
    if (ts < nextMonthStart) return series[i].close;
  }
  return null;
}

function getCurrentPrice(quote: QuoteResponseItem | undefined, history: HistoryPoint[]): number | null {
  if (quote && !('error' in quote) && quote.price != null) return quote.price;
  return history.length ? history[history.length - 1].close : null;
}

/**
 * Simulates "what if I invested monthly for N years?" using historical closes.
 * Assumes equal allocation across all holdings each month.
 */
export default function HistoricalDcaSimulator({ portfolio, quotes }: HistoricalDcaSimulatorProps) {
  const { marketKey, market } = useMarket();
  const [years, setYears] = useState(3);
  const [monthlyAmountInput, setMonthlyAmountInput] = useState(String(market.contribution.default));
  const [seriesBySymbol, setSeriesBySymbol] = useState<Record<string, HistoryPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the contribution to the new market's default on US <-> India toggle.
  useEffect(() => {
    setMonthlyAmountInput(String(market.contribution.default));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketKey]);

  const monthlyAmount = useMemo(() => {
    const parsed = Number.parseFloat(monthlyAmountInput.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  }, [monthlyAmountInput]);

  useEffect(() => {
    let cancelled = false;
    if (!portfolio.length) {
      setSeriesBySymbol({});
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      portfolio.map(async (symbol) => {
        const history = await fetchHistory(symbol, '5y');
        const sorted = [...(history.series || [])].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        return [symbol, sorted] as const;
      })
    )
      .then((entries) => {
        if (cancelled) return;
        setSeriesBySymbol(Object.fromEntries(entries));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load historical prices');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portfolio]);

  const simulation = useMemo(() => {
    if (!portfolio.length) {
      return {
        positions: [] as PositionSimulation[],
        totalInvested: 0,
        totalValue: 0,
        monthsSimulated: 0,
      };
    }

    const months = years * 12;
    const now = new Date();
    const perSymbolContribution = monthlyAmount / portfolio.length;

    const positions = portfolio.map((symbol): PositionSimulation => {
      const series = seriesBySymbol[symbol] || [];
      let shares = 0;
      let invested = 0;

      for (let offset = months - 1; offset >= 0; offset -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const price = getMonthPrice(series, d.getFullYear(), d.getMonth());
        if (!price || price <= 0) continue;
        shares += perSymbolContribution / price;
        invested += perSymbolContribution;
      }

      const currentPrice = getCurrentPrice(quotes[symbol], series) ?? 0;
      const value = shares * currentPrice;
      const returnPct = invested > 0 ? ((value - invested) / invested) * 100 : 0;

      return {
        symbol,
        invested,
        value,
        shares,
        returnPct,
      };
    });

    const totalInvested = positions.reduce((sum, p) => sum + p.invested, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    return { positions, totalInvested, totalValue, monthsSimulated: months };
  }, [portfolio, quotes, seriesBySymbol, monthlyAmount, years]);

  const gain = simulation.totalValue - simulation.totalInvested;
  const gainPct = simulation.totalInvested > 0 ? (gain / simulation.totalInvested) * 100 : 0;

  return (
    <section className="section">
      <div className="section-head">
        <h2>Historical DCA simulator</h2>
        <span className="section-pill">What if</span>
      </div>

      <div className="sim-controls-grid">
        <div className="sim-control">
          <label className="control-label" htmlFor="sim-years">
            Time horizon (years)
          </label>
          <input
            id="sim-years"
            className="sim-number-input"
            type="number"
            min={MIN_YEARS}
            max={MAX_YEARS}
            step={1}
            value={years}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (Number.isNaN(value)) return;
              setYears(Math.min(MAX_YEARS, Math.max(MIN_YEARS, value)));
            }}
          />
        </div>

        <div className="sim-control">
          <label className="control-label" htmlFor="sim-monthly">
            Monthly contribution ({market.currencySymbol})
          </label>
          <input
            id="sim-monthly"
            className="sim-number-input"
            type="text"
            inputMode="decimal"
            value={monthlyAmountInput}
            onChange={(e) => setMonthlyAmountInput(e.target.value)}
            onBlur={() => {
              const min = market.contribution.min;
              const normalized = Number.parseFloat(monthlyAmountInput.replace(/,/g, '').trim());
              if (!Number.isFinite(normalized)) {
                setMonthlyAmountInput(String(min));
                return;
              }
              setMonthlyAmountInput(String(Math.max(min, Math.round(normalized))));
            }}
          />
        </div>
      </div>

      <div className="sim-controls">
        <p className="control-help">
          Type any values you want to test. Historical data currently supports 1-5 years, and buys are
          simulated equally across all holdings each month.
        </p>
      </div>

      {!portfolio.length && <p className="empty-note">Add holdings to run a simulation.</p>}
      {portfolio.length > 0 && loading && <p className="empty-note">Loading historical prices...</p>}
      {portfolio.length > 0 && error && <p className="empty-note">Simulator unavailable: {error}</p>}

      {portfolio.length > 0 && !loading && !error && (
        <>
          <div className="sim-summary-grid">
            <div className="sim-summary-card">
              <div className="sim-summary-label">Total invested</div>
              <div className="sim-summary-value">{formatCurrency(simulation.totalInvested, market)}</div>
            </div>
            <div className="sim-summary-card">
              <div className="sim-summary-label">Current value</div>
              <div className="sim-summary-value">{formatCurrency(simulation.totalValue, market)}</div>
            </div>
            <div className="sim-summary-card">
              <div className="sim-summary-label">Net gain/loss</div>
              <div className={`sim-summary-value ${gain >= 0 ? 'positive' : 'negative'}`}>
                {gain >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(gain), market)} ({Math.abs(gainPct).toFixed(1)}%)
              </div>
            </div>
            <div className="sim-summary-card">
              <div className="sim-summary-label">Months simulated</div>
              <div className="sim-summary-value">{simulation.monthsSimulated}</div>
            </div>
          </div>

          <div className="sim-positions">
            {simulation.positions.map((position) => (
              <div className="sim-position-row" key={position.symbol}>
                <div className="sim-position-symbol">{position.symbol}</div>
                <div className="sim-position-metric">
                  Invested: {formatCurrency(position.invested, market)}
                </div>
                <div className="sim-position-metric">
                  Value: {formatCurrency(position.value, market)}
                </div>
                <div
                  className={`sim-position-metric ${position.returnPct >= 0 ? 'positive' : 'negative'}`}
                >
                  Return: {position.returnPct >= 0 ? '+' : ''}
                  {position.returnPct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
