export type MarketKey = 'us' | 'in';

export interface MarketContribution {
  /** Default monthly DCA amount shown on first load. */
  default: number;
  /** Smallest amount the inputs clamp to. */
  min: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
}

export interface MarketConfig {
  key: MarketKey;
  label: string;
  /** Short label used in the nav toggle. */
  shortLabel: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  defaultPortfolio: string[];
  /**
   * Yahoo Finance exchange suffix auto-appended to bare tickers
   * (e.g. WIPRO -> WIPRO.NS). Tickers already containing a dot are kept as-is.
   */
  symbolSuffix?: string;
  tickerPlaceholder: string;
  showTaxAssistant: boolean;
  contribution: MarketContribution;
}

// Default US holdings: 10 large-cap tech stocks + 15 Vanguard index funds/ETFs.
const US_DEFAULT_PORTFOLIO: string[] = [
  // Tech
  'AAPL',
  'MSFT',
  'NVDA',
  'GOOGL',
  'AMZN',
  'META',
  'TSLA',
  'AVGO',
  'CRM',
  'ADBE',
  // Index funds / ETFs
  'VDIGX',
  'VGENX',
  'VTSAX',
  'ESGV',
  'VDC',
  'VDE',
  'VGT',
  'VHT',
  'VIG',
  'VNQ',
  'VOO',
  'VOOG',
  'VTI',
  'VWO',
  'VXUS',
];

// Default Indian holdings: 10 NSE large caps + index/sector ETFs.
// Yahoo Finance serves NSE symbols with the .NS suffix.
const INDIA_DEFAULT_PORTFOLIO: string[] = [
  // Large caps
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'INFY.NS',
  'BHARTIARTL.NS',
  'ITC.NS',
  'LT.NS',
  'SBIN.NS',
  'TITAN.NS',
  // Index / sector ETFs
  'NIFTYBEES.NS',
  'JUNIORBEES.NS',
  'BANKBEES.NS',
  'ITBEES.NS',
  'GOLDBEES.NS',
  'MON100.NS',
];

export const MARKETS: Record<MarketKey, MarketConfig> = {
  us: {
    key: 'us',
    label: 'US Markets',
    shortLabel: 'US',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    defaultPortfolio: US_DEFAULT_PORTFOLIO,
    tickerPlaceholder: 'Add ticker (e.g., VTV, SCHX)',
    showTaxAssistant: true,
    contribution: {
      default: 2500,
      min: 100,
      sliderMin: 500,
      sliderMax: 10000,
      sliderStep: 100,
    },
  },
  in: {
    key: 'in',
    label: 'Indian Markets',
    shortLabel: 'India',
    currency: 'INR',
    currencySymbol: '\u20b9',
    locale: 'en-IN',
    defaultPortfolio: INDIA_DEFAULT_PORTFOLIO,
    symbolSuffix: '.NS',
    tickerPlaceholder: 'Add NSE ticker (e.g., WIPRO, HCLTECH)',
    showTaxAssistant: false,
    contribution: {
      default: 25000,
      min: 1000,
      sliderMin: 5000,
      sliderMax: 100000,
      sliderStep: 1000,
    },
  },
};

export const DEFAULT_MARKET_KEY: MarketKey = 'us';

export function isMarketKey(value: unknown): value is MarketKey {
  return value === 'us' || value === 'in';
}
