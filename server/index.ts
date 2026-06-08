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

app.use(express.json());

/**
 * GET /api/quotes?symbols=AAPL,MSFT,VOO
 * Returns current price, day change, 50/200-day moving averages, and the
 * 52-week range for each requested symbol. These are exactly the fields the
 * dashboard's buy-signal logic needs.
 */
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
          const q = await yahooFinance.quote(symbol);
          return {
            symbol,
            price: q.regularMarketPrice ?? null,
            change: q.regularMarketChangePercent ?? null,
            ma50: q.fiftyDayAverage ?? null,
            ma200: q.twoHundredDayAverage ?? null,
            high52: q.fiftyTwoWeekHigh ?? null,
            low52: q.fiftyTwoWeekLow ?? null,
            volume: q.regularMarketVolume ?? null,
            name: q.shortName ?? q.longName ?? symbol,
          };
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
