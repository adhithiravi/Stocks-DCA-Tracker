import { Navigate, Route, Routes } from 'react-router-dom';
import AppNav from './components/AppNav';
import DashboardPage from './pages/DashboardPage';
import TaxAssistantPage from './pages/TaxAssistantPage';
import HistoricalSimulatorPage from './pages/HistoricalSimulatorPage';

export default function App() {
  return (
    <>
      <AppNav />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tax-assistant" element={<TaxAssistantPage />} />
        <Route path="/historical-simulator" element={<HistoricalSimulatorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
