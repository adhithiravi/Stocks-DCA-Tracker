import { Navigate, Route, Routes } from 'react-router-dom';
import AppNav from './components/AppNav';
import DashboardPage from './pages/DashboardPage';
import TaxAssistantPage from './pages/TaxAssistantPage';
import HistoricalSimulatorPage from './pages/HistoricalSimulatorPage';
import { MarketProvider, useMarket } from './context/MarketContext';

function AppRoutes() {
  const { market } = useMarket();

  return (
    <>
      <AppNav />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        {/* No Tax Assistant for India; the catch-all sends /tax-assistant home. */}
        {market.showTaxAssistant && <Route path="/tax-assistant" element={<TaxAssistantPage />} />}
        <Route path="/historical-simulator" element={<HistoricalSimulatorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <MarketProvider>
      <AppRoutes />
    </MarketProvider>
  );
}
