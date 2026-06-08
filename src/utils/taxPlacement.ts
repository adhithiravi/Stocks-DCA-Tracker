import type {
  AccountType,
  AccountsState,
  TaxProfile,
  TaxRecommendation,
} from '../types/taxAssistant';

const ACCOUNT_LABELS: Record<AccountType, string> = {
  '401k': '401(k)',
  roth_ira: 'Roth IRA',
  taxable: 'Taxable',
};

const PRIORITY_BY_PROFILE: Record<TaxProfile, AccountType[]> = {
  'reits-income': ['401k', 'roth_ira', 'taxable'],
  'high-turnover': ['401k', 'roth_ira', 'taxable'],
  'broad-index': ['taxable', 'roth_ira', '401k'],
  'individual-stock': ['roth_ira', 'taxable', '401k'],
};

const PROFILE_LABELS: Record<TaxProfile, string> = {
  'broad-index': 'Broad index ETF/fund',
  'reits-income': 'REIT / income-heavy',
  'high-turnover': 'High-turnover strategy',
  'individual-stock': 'Individual stock',
};

// Common ETFs / index funds that should not be treated as individual stocks.
const BROAD_INDEX_FUND_SYMBOLS = new Set([
  // Vanguard + common defaults in this project
  'VTI',
  'VOO',
  'VOOG',
  'VXUS',
  'VWO',
  'VTSAX',
  'VDIGX',
  'VGENX',
  'ESGV',
  'VDC',
  'VDE',
  'VGT',
  'VHT',
  'VIG',
  // Other common index ETFs
  'SPY',
  'IVV',
  'QQQ',
  'DIA',
  'IWM',
  'SCHX',
  'SCHB',
  'ITOT',
  'VEA',
  'BND',
  'AGG',
]);

function labelAccount(account: AccountType): string {
  return ACCOUNT_LABELS[account];
}

export function defaultTaxProfileForSymbol(symbol: string): TaxProfile {
  const normalized = symbol.trim().toUpperCase();
  if (normalized.startsWith('VNQ')) return 'reits-income';
  if (BROAD_INDEX_FUND_SYMBOLS.has(normalized) || normalized.endsWith('X')) {
    return 'broad-index';
  }
  return 'individual-stock';
}

export function formatTaxProfile(profile: TaxProfile): string {
  return PROFILE_LABELS[profile];
}

export function recommendBestAccount(
  symbol: string,
  profile: TaxProfile,
  accounts: AccountsState
): TaxRecommendation {
  const enabledAccounts = (Object.keys(accounts) as AccountType[]).filter((key) => accounts[key].enabled);
  if (!enabledAccounts.length) {
    return {
      symbol,
      profile,
      bestAccount: null,
      reason: 'Enable at least one account to receive recommendations.',
    };
  }

  const preferredOrder = PRIORITY_BY_PROFILE[profile];
  const best = preferredOrder.find((account) => accounts[account].enabled) ?? null;
  if (!best) {
    return {
      symbol,
      profile,
      bestAccount: null,
      reason: 'No eligible account found for this profile.',
    };
  }

  const reasonByProfile: Record<TaxProfile, string> = {
    'reits-income':
      'Income-heavy holdings are generally better in tax-advantaged accounts to reduce taxable distributions.',
    'high-turnover':
      'Higher turnover can trigger more taxable events, so tax-advantaged accounts are preferred.',
    'broad-index':
      'Broad index funds are tax-efficient, making taxable accounts generally suitable.',
    'individual-stock':
      'For individual stocks, prioritize growth-friendly shelter first, then taxable flexibility.',
  };

  return {
    symbol,
    profile,
    bestAccount: best,
    reason: `${reasonByProfile[profile]} Best fit right now: ${labelAccount(best)}.`,
  };
}
