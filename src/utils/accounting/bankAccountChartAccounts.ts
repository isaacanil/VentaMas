import type { BankAccount, ChartOfAccount } from '@/types/accounting';
import type { BankAccountDraft } from './bankAccounts';
import type { ChartOfAccountDraft } from './chartOfAccounts';

export const BANK_CHART_PARENT_CODE = '1110';
export const BANK_CHART_PARENT_SYSTEM_KEY = 'bank';
export const BANK_ACCOUNT_CHART_METADATA_SOURCE = 'bank_account';

type BankAccountChartInput = Pick<
  BankAccount | BankAccountDraft,
  | 'accountNumberLast4'
  | 'currency'
  | 'institutionName'
  | 'name'
  | 'type'
>;

const BANK_ACCOUNT_TYPE_LABELS: Partial<
  Record<NonNullable<BankAccount['type']>, string>
> = {
  checking: 'Corriente',
  savings: 'Ahorros',
  credit_card: 'Tarjeta',
  other: 'Banco',
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findBankChartParentAccount = (
  accounts: readonly ChartOfAccount[],
): ChartOfAccount | null =>
  accounts.find(
    (account) =>
      account.status === 'active' &&
      account.systemKey === BANK_CHART_PARENT_SYSTEM_KEY,
  ) ??
  accounts.find(
    (account) =>
      account.status === 'active' && account.code === BANK_CHART_PARENT_CODE,
  ) ??
  null;

export const buildBankLedgerAccountName = (
  bankAccount: BankAccountChartInput,
): string => {
  const institutionName = toCleanString(bankAccount.institutionName);
  const accountName = toCleanString(bankAccount.name);
  const typeLabel = bankAccount.type
    ? BANK_ACCOUNT_TYPE_LABELS[bankAccount.type] ?? null
    : null;
  const last4 = toCleanString(bankAccount.accountNumberLast4);
  const descriptiveName = [institutionName, typeLabel, last4]
    .filter(Boolean)
    .join(' ');

  return descriptiveName || accountName || 'Cuenta bancaria';
};

export const buildNextBankLedgerAccountCode = ({
  accounts,
  parentCode,
}: {
  accounts: readonly Pick<ChartOfAccount, 'code'>[];
  parentCode: string;
}): string => {
  const escapedParentCode = escapeRegExp(parentCode);
  const childCodePattern = new RegExp(`^${escapedParentCode}\\.(\\d+)$`);
  const usedCodes = new Set(
    accounts.map((account) => account.code.trim().toLowerCase()),
  );
  const nextSequence =
    accounts.reduce((currentMax, account) => {
      const match = account.code.trim().match(childCodePattern);
      if (!match) return currentMax;
      const parsed = Number.parseInt(match[1] ?? '', 10);
      return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
    }, 0) + 1;

  let sequence = nextSequence;
  while (true) {
    const candidate = `${parentCode}.${String(sequence).padStart(2, '0')}`;
    if (!usedCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
    sequence += 1;
  }
};

export const buildBankLedgerChartAccountDraft = ({
  accounts,
  bankAccount,
  bankAccountId,
  parentAccount,
}: {
  accounts: readonly ChartOfAccount[];
  bankAccount: BankAccountChartInput;
  bankAccountId: string;
  parentAccount: ChartOfAccount;
}): ChartOfAccountDraft => ({
  code: buildNextBankLedgerAccountCode({
    accounts,
    parentCode: parentAccount.code,
  }),
  name: buildBankLedgerAccountName(bankAccount),
  type: 'asset',
  subtype: 'bank_account',
  parentId: parentAccount.id,
  postingAllowed: true,
  normalSide: 'debit',
  currencyMode: 'multi_currency_reference',
  systemKey: null,
  metadata: {
    source: BANK_ACCOUNT_CHART_METADATA_SOURCE,
    bankAccountId,
    bankAccountName: bankAccount.name,
    bankAccountCurrency: bankAccount.currency,
  },
});
