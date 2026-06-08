export type HistoryRange = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

export type StrategyKey = 'undervalued' | 'equal';

export interface QuoteData {
  symbol: string;
  price: number | null;
  change: number | null;
  ma50: number | null;
  ma200: number | null;
  high52: number | null;
  low52: number | null;
  volume?: number | null;
  name?: string;
}

export interface QuoteError {
  symbol: string;
  error: string;
}

export type QuoteResponseItem = QuoteData | QuoteError;
export type QuotesMap = Record<string, QuoteResponseItem | undefined>;

export interface HistoryPoint {
  date: string | Date;
  close: number;
}

export interface HistoryResponse {
  symbol: string;
  range: HistoryRange;
  series: HistoryPoint[];
}

export interface StrategyDefinition {
  label: string;
  description: string;
  detail: string;
  fn: (portfolio: string[], quotes: QuotesMap, monthlyAmount: number) => Record<string, number>;
}
