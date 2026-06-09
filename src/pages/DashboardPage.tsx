import { useMemo, useState } from 'react';
import MetricGrid from '../components/MetricGrid';
import DipOpportunities from '../components/DipOpportunities';
import ContributionSettings from '../components/ContributionSettings';
import HoldingsGrid from '../components/HoldingsGrid';
import StockChart from '../components/StockChart';
import ValuationRegimeBadge from '../components/ValuationRegimeBadge';
import AllocationOutputPanel from '../components/AllocationOutputPanel';
import { usePortfolio } from '../hooks/usePortfolio';
import { useQuotes } from '../hooks/useQuotes';
import { IS_PROD_API_CONFIGURED } from '../api/stocks';
import { STRATEGIES } from '../utils/allocation';
import { getBuySignals } from '../utils/signals';
import { getValuationRegime } from '../utils/valuationRegime';
import type { StrategyKey } from '../types/stocks';

/**
 * Main dashboard page. Owns shared UI state and ties portfolio + quotes data to
 * presentational components.
 */
export default function DashboardPage() {
  const { portfolio, addSymbol, removeSymbol } = usePortfolio();
  const { quotes, loading, error, refresh } = useQuotes(portfolio);

  const [monthlyAmount, setMonthlyAmount] = useState(2500);
  const [strategy, setStrategy] = useState<StrategyKey>('undervalued');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const signalCount = useMemo(
    () => portfolio.filter((s) => getBuySignals(quotes[s])).length,
    [portfolio, quotes]
  );
  const valuationRegime = useMemo(() => getValuationRegime(portfolio, quotes), [portfolio, quotes]);

  return (
    <div className="container">
      <header className="header">
        <span className="page-eyebrow">Portfolio dashboard</span>
        <h1>DCA plan</h1>
        <p>
          Monitor signals, adjust monthly contributions, and stay consistent with your long-term
          investing strategy.
        </p>
        <div className="status-bar">
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Refreshing\u2026' : 'Refresh prices'}
          </button>
          <ValuationRegimeBadge result={valuationRegime} />
          {error && <span style={{ color: 'var(--negative)' }}>{error}</span>}
        </div>
      </header>

      {error && (
        <div className="banner">
          {!IS_PROD_API_CONFIGURED && import.meta.env.PROD ? (
            <>
              Could not reach the price API. This production build is missing
              <code> VITE_API_BASE_URL</code>, so requests are going to <code>/api</code> on this
              static host. Deploy the backend separately and set the GitHub Pages build variable.
            </>
          ) : (
            <>
              Could not reach the price API. Make sure the backend is running
              (<code>npm run dev:server</code>) or that <code>VITE_API_BASE_URL</code> points to a
              live backend. Yahoo data is fetched server-side because the browser cannot call Yahoo
              directly.
            </>
          )}
        </div>
      )}

      <MetricGrid
        holdingsCount={portfolio.length}
        signalCount={signalCount}
        monthlyAmount={monthlyAmount}
        strategyLabel={STRATEGIES[strategy].label}
      />

      <div className="dashboard-main-grid">
        <DipOpportunities
          portfolio={portfolio}
          quotes={quotes}
          onRemove={removeSymbol}
          onSelect={setSelectedSymbol}
        />

        <ContributionSettings
          monthlyAmount={monthlyAmount}
          onAmountChange={setMonthlyAmount}
          strategy={strategy}
          onStrategyChange={setStrategy}
        />
      </div>

      <HoldingsGrid
        portfolio={portfolio}
        quotes={quotes}
        onAdd={addSymbol}
        onRemove={removeSymbol}
        onSelect={setSelectedSymbol}
      />

      <AllocationOutputPanel
        portfolio={portfolio}
        quotes={quotes}
        monthlyAmount={monthlyAmount}
        strategy={strategy}
        onSelect={setSelectedSymbol}
      />

      {selectedSymbol && (
        <StockChart
          symbol={selectedSymbol}
          quote={quotes[selectedSymbol]}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}
