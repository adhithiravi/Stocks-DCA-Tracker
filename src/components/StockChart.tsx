import { useState, useEffect, useMemo } from 'react';
import { fetchHistory } from '../api/stocks';
import { useMarket } from '../context/MarketContext';
import { formatPrice } from '../utils/format';
import type { HistoryPoint, HistoryRange, QuoteResponseItem } from '../types/stocks';

const RANGES: HistoryRange[] = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];
const RANGE_LABELS: Record<HistoryRange, string> = {
  '1mo': '1M',
  '3mo': '3M',
  '6mo': '6M',
  '1y': '1Y',
  '2y': '2Y',
  '5y': '5Y',
};

// SVG drawing area. The viewBox is fixed; CSS scales it responsively.
const W = 720;
const H = 320;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };

interface StockChartProps {
  symbol: string;
  quote: QuoteResponseItem | undefined;
  onClose: () => void;
}

interface HoverState {
  idx: number;
  point: HistoryPoint;
}

interface ChartData {
  x: (i: number) => number;
  y: (v: number) => number;
  linePath: string;
  areaPath: string;
  yTicks: Array<{ v: number; y: number }>;
  xTicks: Array<{ idx: number; x: number; date: string | Date }>;
  last: number;
  pctChange: number;
}

/**
 * Modal that shows a single stock's price history as an SVG line chart.
 * Defaults to a 5-year view and lets the user switch ranges. Built with raw
 * SVG (no chart library) to keep the dependency footprint at zero.
 */
export default function StockChart({ symbol, quote, onClose }: StockChartProps) {
  const { market } = useMarket();
  const [range, setRange] = useState<HistoryRange>('5y');
  const [series, setSeries] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory(symbol, range)
      .then((data) => {
        if (cancelled) return;
        const points = (data.series || []).filter((p) => p.close != null);
        setSeries(points);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const chart = useMemo<ChartData | null>(() => {
    if (series.length < 2) return null;

    const closes = series.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const x = (i: number) => PAD.left + (i / (series.length - 1)) * innerW;
    const y = (v: number) => PAD.top + (1 - (v - min) / span) * innerH;

    const linePath = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.close)}`).join(' ');
    const areaPath =
      `${linePath} L${x(series.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;

    // Y-axis ticks (5 evenly spaced price levels).
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const v = min + (span * i) / 4;
      return { v, y: y(v) };
    });

    // X-axis ticks: a handful of evenly spaced dates.
    const tickCount = Math.min(6, series.length);
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const idx = Math.round((i / (tickCount - 1)) * (series.length - 1));
      return { idx, x: x(idx), date: series[idx].date };
    });

    const first = closes[0];
    const last = closes[closes.length - 1];
    const pctChange = ((last - first) / first) * 100;

    return { x, y, linePath, areaPath, yTicks, xTicks, last, pctChange };
  }, [series]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chart || series.length < 2) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Map the pointer's pixel position into the SVG's viewBox coordinate space.
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const innerW = W - PAD.left - PAD.right;
    const ratio = Math.min(1, Math.max(0, (svgX - PAD.left) / innerW));
    const idx = Math.round(ratio * (series.length - 1));
    setHover(series[idx] ? { idx, point: series[idx] } : null);
  };

  const up = chart ? chart.pctChange >= 0 : true;
  const lineColor = up ? 'var(--positive)' : 'var(--negative)';

  const fmtDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  };
  const fmtAxisDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  const companyName = quote && !('error' in quote) ? quote.name : undefined;

  return (
    <div className="chart-overlay" onClick={onClose}>
      <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chart-head">
          <div>
            <div className="chart-title">{symbol}</div>
            {companyName && companyName !== symbol && <div className="chart-subtitle">{companyName}</div>}
          </div>
          <div className="chart-head-right">
            {chart && (
              <div className="chart-price-block">
                <span className="chart-current">{formatPrice(chart.last, market)}</span>
                <span className={`chart-pct ${up ? 'positive' : 'negative'}`}>
                  {up ? '\u2191' : '\u2193'} {Math.abs(chart.pctChange).toFixed(1)}% &middot;{' '}
                  {RANGE_LABELS[range]}
                </span>
              </div>
            )}
            <button className="chart-close" onClick={onClose} aria-label="Close chart">
              &#10005;
            </button>
          </div>
        </div>

        <div className="chart-ranges">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`chart-range-btn${range === r ? ' active' : ''}`}
              onClick={() => setRange(r)}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="chart-body">
          {loading && <div className="chart-status">Loading history&hellip;</div>}
          {error && <div className="chart-status error">{error}</div>}
          {!loading && !error && !chart && (
            <div className="chart-status">Not enough data to chart this range.</div>
          )}
          {!loading && !error && chart && (
            <svg
              className="chart-svg"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              onMouseMove={handleMove}
              onMouseLeave={() => setHover(null)}
            >
              {chart.yTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    y1={t.y}
                    x2={W - PAD.right}
                    y2={t.y}
                    className="chart-gridline"
                  />
                  <text x={PAD.left - 8} y={t.y + 4} className="chart-axis-label" textAnchor="end">
                    {market.currencySymbol}{t.v.toFixed(0)}
                  </text>
                </g>
              ))}

              {chart.xTicks.map((t, i) => (
                <text key={i} x={t.x} y={H - 8} className="chart-axis-label" textAnchor="middle">
                  {fmtAxisDate(t.date)}
                </text>
              ))}

              <path d={chart.areaPath} fill={lineColor} className="chart-area" />
              <path d={chart.linePath} fill="none" stroke={lineColor} strokeWidth="2" />

              {hover && (
                <g>
                  <line
                    x1={chart.x(hover.idx)}
                    y1={PAD.top}
                    x2={chart.x(hover.idx)}
                    y2={H - PAD.bottom}
                    className="chart-cursor"
                  />
                  <circle
                    cx={chart.x(hover.idx)}
                    cy={chart.y(hover.point.close)}
                    r="4"
                    fill={lineColor}
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
          )}

          {hover && chart && (
            <div className="chart-tooltip">
              <strong>{formatPrice(hover.point.close, market)}</strong>
              <span>{fmtDate(hover.point.date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
