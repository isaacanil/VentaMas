import type {
  BankAccount,
  BankReconciliationRecord,
  CashAccount,
  InternalTransfer,
  LiquidityAccountType,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import { buildBankAccountLabel } from '@/utils/accounting/bankAccounts';
import { buildCashAccountLabel } from '@/utils/accounting/cashAccounts';
import { toMillis } from '@/utils/firebase/toTimestamp';

export interface TreasuryLiquidityAccount {
  id: string;
  key: string;
  kind: LiquidityAccountType;
  label: string;
  currency: BankAccount['currency'];
  status: 'active' | 'inactive';
  openingBalance: number;
  openingBalanceDate?: BankAccount['openingBalanceDate'] | CashAccount['openingBalanceDate'] | null;
  notes?: string | null;
  institutionName?: string | null;
  location?: string | null;
  source: BankAccount | CashAccount;
}

export const buildLiquidityAccountKey = (
  kind: LiquidityAccountType,
  accountId: string,
) => `${kind}:${accountId}`;

export const parseLiquidityAccountKey = (
  value: string | null | undefined,
): { accountId: string; kind: LiquidityAccountType } | null => {
  if (typeof value !== 'string') return null;
  const [kind, accountId] = value.split(':');
  if (!accountId || (kind !== 'bank' && kind !== 'cash')) {
    return null;
  }

  return {
    accountId,
    kind,
  };
};

export const buildTreasuryLiquidityAccounts = ({
  bankAccounts,
  cashAccounts,
}: {
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
}): TreasuryLiquidityAccount[] =>
  [
    ...bankAccounts.map((account) => ({
      id: account.id,
      key: buildLiquidityAccountKey('bank', account.id),
      kind: 'bank' as const,
      label: buildBankAccountLabel(account),
      currency: account.currency,
      status: account.status,
      openingBalance: Number(account.openingBalance ?? 0),
      openingBalanceDate: account.openingBalanceDate ?? null,
      notes: account.notes ?? null,
      institutionName: account.institutionName ?? null,
      source: account,
    })),
    ...cashAccounts.map((account) => ({
      id: account.id,
      key: buildLiquidityAccountKey('cash', account.id),
      kind: 'cash' as const,
      label: buildCashAccountLabel(account),
      currency: account.currency,
      status: account.status,
      openingBalance: Number(account.openingBalance ?? 0),
      openingBalanceDate: account.openingBalanceDate ?? null,
      notes: account.notes ?? null,
      location: account.location ?? null,
      source: account,
    })),
  ].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    if (left.kind !== right.kind) {
      return left.kind === 'bank' ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });

export const resolveLiquidityAmountSigned = (
  entry: Pick<LiquidityLedgerEntry, 'amount' | 'direction'>,
) => {
  const amount = Number(entry.amount ?? 0);
  return entry.direction === 'out' ? -amount : amount;
};

export const calculateLiquidityCurrentBalance = ({
  account,
  entries,
}: {
  account: TreasuryLiquidityAccount;
  entries: LiquidityLedgerEntry[];
}) =>
  account.openingBalance +
  entries
    .filter((entry) => entry.status !== 'void')
    .reduce((total, entry) => total + resolveLiquidityAmountSigned(entry), 0);

export const groupLedgerEntriesByAccount = (
  entries: LiquidityLedgerEntry[],
): Record<string, LiquidityLedgerEntry[]> =>
  entries.reduce<Record<string, LiquidityLedgerEntry[]>>((accumulator, entry) => {
    const key = buildLiquidityAccountKey(entry.accountType, entry.accountId);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(entry);
    return accumulator;
  }, {});

export const sortByOccurredAtDesc = <T extends { createdAt?: unknown; occurredAt?: unknown }>(
  items: T[],
) =>
  [...items].sort((left, right) => {
    const rightMs = toMillis(right.occurredAt ?? right.createdAt ?? null) ?? 0;
    const leftMs = toMillis(left.occurredAt ?? left.createdAt ?? null) ?? 0;
    return rightMs - leftMs;
  });

export const getLatestReconciliationByBankAccount = (
  records: BankReconciliationRecord[],
): Record<string, BankReconciliationRecord> =>
  sortByOccurredAtDesc(
    records.map((record) => ({
      ...record,
      occurredAt: record.statementDate,
    })),
  ).reduce<Record<string, BankReconciliationRecord>>((accumulator, record) => {
    if (!accumulator[record.bankAccountId]) {
      accumulator[record.bankAccountId] = record;
    }

    return accumulator;
  }, {});

export const getTransfersForLiquidityAccount = (
  transfers: InternalTransfer[],
  account: TreasuryLiquidityAccount | null,
) => {
  if (!account) return [];

  return transfers.filter(
    (transfer) =>
      (transfer.fromAccountType === account.kind &&
        transfer.fromAccountId === account.id) ||
      (transfer.toAccountType === account.kind &&
        transfer.toAccountId === account.id),
  );
};
