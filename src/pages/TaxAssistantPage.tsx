import { usePortfolio } from '../hooks/usePortfolio';
import { useTaxAssistant } from '../hooks/useTaxAssistant';
import type { AccountType } from '../types/taxAssistant';
import { formatTaxProfile } from '../utils/taxPlacement';

const ACCOUNT_ORDER: AccountType[] = ['401k', 'roth_ira', 'taxable'];
const ACCOUNT_LABELS: Record<AccountType, string> = {
  '401k': '401(k)',
  roth_ira: 'Roth IRA',
  taxable: 'Taxable',
};

export default function TaxAssistantPage() {
  const { portfolio } = usePortfolio();
  const { accounts, recommendations, setAccountEnabled } = useTaxAssistant(portfolio);

  return (
    <div className="container">
      <header className="header">
        <span className="page-eyebrow">Tax assistant</span>
        <h1>Place each holding in the right account</h1>
        <p>
          Turn on the accounts you have and we will automatically suggest the best place to buy each
          holding.
        </p>
      </header>

      <section className="section">
        <div className="section-head">
          <h2>Account setup</h2>
          <span className="section-pill">Step 1</span>
        </div>
        <div className="tax-accounts-grid">
          {ACCOUNT_ORDER.map((account) => (
            <div className="tax-account-card" key={account}>
              <label className="tax-account-toggle">
                <input
                  type="checkbox"
                  checked={accounts[account].enabled}
                  onChange={(e) => setAccountEnabled(account, e.target.checked)}
                  aria-label={`${ACCOUNT_LABELS[account]} available`}
                />
                <span>{ACCOUNT_LABELS[account]} available</span>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Where to buy each holding</h2>
          <span className="section-pill">Step 2</span>
        </div>
        {!portfolio.length ? (
          <p className="empty-note">Add holdings on the Dashboard page to get recommendations.</p>
        ) : (
          <div className="tax-list">
            {recommendations.map((row) => (
              <div className="tax-row-card" key={row.symbol}>
                <div className="tax-row-main">
                  <div className="tax-symbol-wrap">
                    <span className="tax-symbol">{row.symbol}</span>
                    <span className="tax-chip auto">{formatTaxProfile(row.profile)}</span>
                  </div>
                  <div className="tax-best-account">
                    {row.bestAccount ? ACCOUNT_LABELS[row.bestAccount] : 'No account enabled'}
                  </div>
                </div>
                <p className="tax-reason">{row.reason}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
