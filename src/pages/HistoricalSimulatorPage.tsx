import HistoricalDcaSimulator from '../components/HistoricalDcaSimulator';
import { usePortfolio } from '../hooks/usePortfolio';
import { useQuotes } from '../hooks/useQuotes';

export default function HistoricalSimulatorPage() {
  const { portfolio } = usePortfolio();
  const { quotes, loading, error, refresh } = useQuotes(portfolio);

  return (
    <div className="container">
      <header className="header">
        <span className="page-eyebrow">Simulator</span>
        <h1>Historical DCA simulator</h1>
        <p>
          Test what your monthly investing plan could have looked like over past years using historical
          price data.
        </p>
        <div className="status-bar">
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Refreshing\u2026' : 'Refresh prices'}
          </button>
          {error && <span style={{ color: 'var(--negative)' }}>{error}</span>}
        </div>
      </header>

      <HistoricalDcaSimulator portfolio={portfolio} quotes={quotes} />
    </div>
  );
}
