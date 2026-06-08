interface MetricGridProps {
  holdingsCount: number;
  signalCount: number;
  monthlyAmount: number;
  strategyLabel: string;
}

/**
 * Displays the top-row summary metrics (holdings count, buy signals, etc.).
 */
export default function MetricGrid({
  holdingsCount,
  signalCount,
  monthlyAmount,
  strategyLabel,
}: MetricGridProps) {
  const metrics = [
    {
      label: 'Assets tracked',
      value: holdingsCount,
      hint: holdingsCount === 1 ? '1 holding in your plan' : `${holdingsCount} holdings in your plan`,
    },
    {
      label: 'Buy signals',
      value: signalCount,
      positive: true,
      hint: signalCount > 0 ? 'Potential opportunities detected' : 'No strong dip signals today',
    },
    {
      label: 'Monthly DCA',
      value: `$${monthlyAmount.toLocaleString()}`,
      hint: 'Current monthly contribution target',
    },
    {
      label: 'Allocation style',
      value: strategyLabel,
      hint: 'How funds are split each month',
      compact: true,
    },
  ];

  return (
    <div className="metric-grid">
      {metrics.map((m) => (
        <div className="metric-card" key={m.label}>
          <div className="metric-label">{m.label}</div>
          <div className={`metric-value${m.positive ? ' positive' : ''}${m.compact ? ' compact' : ''}`}>
            {m.value}
          </div>
          <p className="metric-hint">{m.hint}</p>
        </div>
      ))}
    </div>
  );
}
