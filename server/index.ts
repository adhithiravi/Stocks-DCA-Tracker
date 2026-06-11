import express, { type Request, type Response } from 'express';
import YahooFinance from 'yahoo-finance2';
import type { HistoryRange, QuoteResponseItem } from '../src/types/stocks';

// yahoo-finance2 v3 exports a class that must be instantiated (v2 exposed a
// ready-to-use singleton). Suppress the one-time survey notice for clean logs.
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// ---------------------------------------------------------------------------
// Express backend
// ---------------------------------------------------------------------------
// Yahoo Finance has no official public API, and the yahoo-finance2 library
// cannot run in the browser (CORS + cookie restrictions). So this small server
// acts as a proxy: the React frontend calls these endpoints, and we fetch from
// Yahoo here on the server and return clean JSON.
// ---------------------------------------------------------------------------

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsAllowedOrigins = new Set([...defaultAllowedOrigins, ...allowedOrigins]);

function applyCors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!corsAllowedOrigins.has(origin)) return;

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
}

app.use(express.json());
app.use((req, res, next) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

/**
 * GET /api/quotes?symbols=AAPL,MSFT,VOO
 * Returns current price, day change, 50/200-day moving averages, and the
 * 52-week range for each requested symbol. These are exactly the fields the
 * dashboard's buy-signal logic needs.
 *
 * Built from the v8 chart endpoint rather than yahooFinance.quote(): the v7
 * quote API requires a cookie+crumb handshake that Yahoo rejects from
 * datacenter IPs (Render, AWS, ...), while the chart API works everywhere.
 */
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function quoteFromChart(symbol: string): Promise<QuoteResponseItem> {
  const period2 = new Date();
  const period1 = new Date(period2);
  period1.setFullYear(period1.getFullYear() - 1);

  const result = await yahooFinance.chart(symbol, { period1, period2, interval: '1d' });
  const meta = result.meta;
  const closes = (result.quotes || [])
    .filter((row) => row?.close != null)
    .map((row) => row.close as number);

  const price = meta.regularMarketPrice ?? closes.at(-1) ?? null;
  // The last bar is the most recent session, so the bar before it holds the
  // previous close. chartPreviousClose only covers the single-bar case.
  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose ?? null;
  const change = price != null && prevClose ? ((price - prevClose) / prevClose) * 100 : null;

  return {
    symbol,
    price,
    change,
    ma50: closes.length >= 50 ? average(closes.slice(-50)) : null,
    ma200: closes.length >= 200 ? average(closes.slice(-200)) : null,
    high52: meta.fiftyTwoWeekHigh ?? (closes.length ? Math.max(...closes) : null),
    low52: meta.fiftyTwoWeekLow ?? (closes.length ? Math.min(...closes) : null),
    volume: meta.regularMarketVolume ?? result.quotes?.at(-1)?.volume ?? null,
    name: meta.shortName ?? meta.longName ?? symbol,
  };
}

app.get('/api/quotes', async (req: Request, res: Response) => {
  const symbols = String(req.query.symbols ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return res.status(400).json({ error: 'No symbols provided' });
  }

  try {
    const results: QuoteResponseItem[] = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return await quoteFromChart(symbol);
        } catch (err) {
          // A single bad ticker should not fail the whole batch, but log the
          // real reason so genuine outages are not hidden behind "not found".
          console.error(`[quotes] ${symbol} failed:`, err instanceof Error ? err.message : String(err));
          return { symbol, error: 'Not found or unavailable' };
        }
      })
    );

    return res.json({ quotes: results });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch quotes',
      detail: String(err),
    });
  }
});

/**
 * GET /api/history?symbol=AAPL&range=1y
 * Returns daily closing prices for charting longer-term trends.
 * range: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'
 */
app.get('/api/history', async (req: Request, res: Response) => {
  const symbol = String(req.query.symbol ?? '').trim().toUpperCase();
  const range = String(req.query.range ?? '1y') as HistoryRange;

  if (!symbol) {
    return res.status(400).json({ error: 'No symbol provided' });
  }

  const now = new Date();
  const period1 = new Date(now);
  const map: Record<HistoryRange, number> = { '1mo': 1, '3mo': 3, '6mo': 6, '1y': 12, '2y': 24, '5y': 60 };
  period1.setMonth(now.getMonth() - (map[range] || 12));

  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2: now,
      interval: '1d',
    });

    const series = (result.quotes || [])
      .filter((row) => row?.date && row?.close != null)
      .map((row) => ({
        date: row.date,
        close: row.close as number,
      }));

    return res.json({ symbol, range, series });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch history', detail: String(err) });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`DCA dashboard API listening on http://localhost:${PORT}`);
});
