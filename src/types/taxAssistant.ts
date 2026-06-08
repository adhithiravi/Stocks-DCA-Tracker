export type AccountType = '401k' | 'roth_ira' | 'taxable';

export type TaxProfile = 'broad-index' | 'reits-income' | 'high-turnover' | 'individual-stock';

export interface AccountConfig {
  enabled: boolean;
}

export type AccountsState = Record<AccountType, AccountConfig>;

export interface TaxAssistantState {
  accounts: AccountsState;
}

export interface TaxRecommendation {
  symbol: string;
  profile: TaxProfile;
  bestAccount: AccountType | null;
  reason: string;
}
