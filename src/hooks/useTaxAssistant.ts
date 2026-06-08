import { useEffect, useMemo, useState } from 'react';
import type {
  AccountType,
  AccountsState,
  TaxAssistantState,
  TaxRecommendation,
} from '../types/taxAssistant';
import { defaultTaxProfileForSymbol, recommendBestAccount } from '../utils/taxPlacement';

const STORAGE_KEY = 'dca_tax_assistant';

const DEFAULT_ACCOUNTS: AccountsState = {
  '401k': { enabled: true },
  roth_ira: { enabled: true },
  taxable: { enabled: true },
};

function normalizeState(raw?: Partial<TaxAssistantState>): TaxAssistantState {
  return {
    accounts: {
      '401k': { enabled: raw?.accounts?.['401k']?.enabled ?? DEFAULT_ACCOUNTS['401k'].enabled },
      roth_ira: { enabled: raw?.accounts?.roth_ira?.enabled ?? DEFAULT_ACCOUNTS.roth_ira.enabled },
      taxable: { enabled: raw?.accounts?.taxable?.enabled ?? DEFAULT_ACCOUNTS.taxable.enabled },
    },
  };
}

export function useTaxAssistant(symbols: string[]) {
  const [state, setState] = useState<TaxAssistantState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as Partial<TaxAssistantState>) : undefined;
      return normalizeState(parsed);
    } catch {
      return normalizeState();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const recommendations = useMemo<TaxRecommendation[]>(() => {
    return symbols.map((symbol) => {
      const profile = defaultTaxProfileForSymbol(symbol);
      return recommendBestAccount(symbol, profile, state.accounts);
    });
  }, [symbols, state.accounts]);

  const setAccountEnabled = (account: AccountType, enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [account]: {
          ...prev.accounts[account],
          enabled,
        },
      },
    }));
  };

  return {
    accounts: state.accounts,
    recommendations,
    setAccountEnabled,
  };
}
