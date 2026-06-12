import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { MARKETS, type MarketKey } from '../utils/markets';

const MARKET_ORDER: MarketKey[] = ['us', 'in'];

export default function AppNav() {
  const { marketKey, market, setMarketKey } = useMarket();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMarketChange = (key: MarketKey) => {
    if (key === marketKey) return;
    setMarketKey(key);
    // The Tax Assistant tab doesn't exist for India; bounce back to the dashboard.
    if (!MARKETS[key].showTaxAssistant && location.pathname === '/tax-assistant') {
      navigate('/', { replace: true });
    }
  };

  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav-inner">
        <div className="app-nav-brand">
          <span className="app-nav-title">DCA Command Center</span>
          <span className="app-nav-subtitle">Long-term investing workflow</span>
        </div>
        <div className="app-nav-right">
          <div className="market-toggle" role="group" aria-label="Market">
            {MARKET_ORDER.map((key) => (
              <button
                type="button"
                key={key}
                className={`market-toggle-btn${marketKey === key ? ' active' : ''}`}
                onClick={() => handleMarketChange(key)}
                aria-pressed={marketKey === key}
              >
                {MARKETS[key].shortLabel}
              </button>
            ))}
          </div>
          <div className="app-nav-links">
            <NavLink to="/" end className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink
              to="/historical-simulator"
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            >
              Simulator
            </NavLink>
            {market.showTaxAssistant && (
              <NavLink
                to="/tax-assistant"
                className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
              >
                Tax Assistant
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
