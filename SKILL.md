---
name: dca-dashboard
description: >
  Work with the DCA Investment Dashboard — a React + Vite frontend backed by an
  Express proxy that fetches live Yahoo Finance data. Use this skill when adding
  features, changing buy-signal rules or allocation strategies, wiring new API
  endpoints, or debugging the dashboard. Covers where each concern lives and the
  conventions to follow.
---

# DCA Dashboard

A long-term-investing dashboard that surfaces dip-buying opportunities and helps
allocate monthly dollar-cost-averaging (DCA) contributions. Frontend in React
(Vite); live prices come from Yahoo Finance through a small Express proxy.

## Architecture in one paragraph

The browser never calls Yahoo directly — Yahoo has no official API and the
`yahoo-finance2` library is blocked in the browser by CORS/cookies. Instead,
`server/index.js` (Express) fetches from Yahoo server-side and exposes clean
JSON at `/api/quotes` and `/api/history`. In dev, Vite proxies `/api` to the
Express server (port 3001). The React app only ever talks to `/api`.

## Where things live

- **Buy-signal rules** → `src/utils/signals.js`. Pure functions. Edit
  `getBuySignals(data)` to change thresholds or add indicators (RSI, MACD, etc.).
  `undervaluationScore(data)` ranks how cheap a holding is vs. its 50-day MA.
- **Allocation strategies** → `src/utils/allocation.js`. Each strategy is a pure
  function `(portfolio, quotes, monthlyAmount) => { symbol: dollars }`. Register
  new ones in the `STRATEGIES` object so the UI toggle picks them up automatically.
- **Default holdings** → `src/utils/constants.js`.
- **Backend endpoints** → `server/index.js`. Add new Yahoo-backed routes here.
- **API client** → `src/api/stocks.js`. Add a matching `fetch()` wrapper for any
  new backend endpoint.
- **State** → `src/hooks/`. `usePortfolio` owns the holdings list (+ localStorage);
  `useQuotes` owns fetching/loading/error for prices.
- **UI** → `src/components/`. Presentational components; they receive data via
  props and stay logic-free. Shared state lives in `src/App.jsx`.

## Conventions

- **Keep logic out of components.** Calculations belong in `utils/`; data
  fetching belongs in `hooks/` or `api/`. Components render and emit events only.
- **Pure functions in `utils/`** — no React imports, so they stay testable.
- **New strategy?** Add the function + an entry in `STRATEGIES`. Nothing else needed.
- **New signal?** Add it inside `getBuySignals` and return a readable string;
  the dip list and badges render whatever strings come back.
- **New data field?** Add it to the quote mapping in `server/index.js` first,
  then consume it downstream.

## Running it

```bash
npm install
npm run dev        # Express (3001) + Vite (5173) together via concurrently
```

`npm run dev:server` and `npm run dev:client` run them separately. Requires
Node.js 20+.

## Common tasks

- **Add historical price charts:** `/api/history` and `fetchHistory()` already
  exist. Create a chart component that calls `fetchHistory(symbol, '1y')` and
  renders the `series` array.
- **Add price alerts:** extend `usePortfolio` to store a target price per symbol,
  then compare against `quotes[symbol].price`.
- **Auto-refresh prices:** add a `setInterval` calling `refresh()` inside
  `useQuotes`.

## Guardrails

- Don't try to call Yahoo from the frontend — it will fail on CORS. Route through
  the Express proxy.
- This is not financial advice; keep the disclaimer in the README intact.
