import type { ValuationRegimeResult } from '../utils/valuationRegime';

interface ValuationRegimeBadgeProps {
  result: ValuationRegimeResult;
}

export default function ValuationRegimeBadge({ result }: ValuationRegimeBadgeProps) {
  return (
    <span className={`valuation-badge ${result.regime.toLowerCase()}`} title={result.detail}>
      Valuation: {result.regime}
    </span>
  );
}
