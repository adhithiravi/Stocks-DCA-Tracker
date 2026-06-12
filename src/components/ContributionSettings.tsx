import { STRATEGIES } from '../utils/allocation';
import { useMarket } from '../context/MarketContext';
import type { StrategyKey } from '../types/stocks';

interface ContributionSettingsProps {
  monthlyAmount: number;
  onAmountChange: (value: number) => void;
  strategy: StrategyKey;
  onStrategyChange: (strategy: StrategyKey) => void;
}

/**
 * Controls for the monthly DCA amount and the allocation strategy.
 * Fully controlled by the parent via props.
 */
export default function ContributionSettings({
  monthlyAmount,
  onAmountChange,
  strategy,
  onStrategyChange,
}: ContributionSettingsProps) {
  const { market } = useMarket();
  const { min, sliderMin, sliderMax, sliderStep } = market.contribution;

  return (
    <div className="section">
      <div className="section-head">
        <h2>Contribution settings</h2>
        <span className="section-pill">Monthly plan builder</span>
      </div>

      <div className="control-group">
        <label className="control-label">Monthly DCA amount ({market.currencySymbol})</label>
        <div className="slider-display">
          <input
            type="range"
            className="input-slider"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={monthlyAmount}
            onChange={(e) => onAmountChange(parseInt(e.target.value, 10))}
          />
          <input
            type="number"
            value={monthlyAmount}
            onChange={(e) => onAmountChange(Math.max(min, parseInt(e.target.value, 10) || 0))}
          />
        </div>
        <p className="control-help">Set a realistic amount you can consistently invest each month.</p>
      </div>

      <div className="control-group">
        <label className="control-label">Allocation strategy</label>
        <div className="button-group">
          {Object.entries(STRATEGIES).map(([key, { label }]) => (
            <button
              type="button"
              key={key}
              className={`btn${strategy === key ? ' active' : ''}`}
              onClick={() => onStrategyChange(key as StrategyKey)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="strategy-explainer">
          {Object.entries(STRATEGIES).map(([key, { label, detail }]) => (
            <div
              key={key}
              className={`strategy-explainer-item${strategy === key ? ' active' : ''}`}
            >
              <div className="strategy-explainer-title">{label}</div>
              <p className="strategy-explainer-detail">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
