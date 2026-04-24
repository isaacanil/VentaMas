import type {
  BankReconciliationRecord,
  BankStatementLine,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { toMillis } from '@/utils/firebase/toTimestamp';

const escapeCsvCell = (value: unknown) => {
  const normalized = String(value ?? '');
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }
  return `"${normalized.replace(/"/g, '""')}"`;
};

const buildCsv = (rows: Array<Record<string, unknown>>) => {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(','),
    ),
  ].join('\n');
};

const formatDate = (value: unknown) => {
  const millis = toMillis(value as never);
  if (millis == null) return '';
  return new Date(millis).toISOString();
};

const formatSignedAmount = ({
  amount,
  direction,
}: {
  amount: number;
  direction: 'in' | 'out';
}) => (direction === 'out' ? -Number(amount ?? 0) : Number(amount ?? 0));

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export const downloadCsvFile = ({
  csv,
  fileName,
}: {
  csv: string;
  fileName: string;
}) => {
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const buildTreasuryCockpitCsv = ({
  accounts,
  currentBalancesByAccountKey,
  latestReconciliationsByBankAccountId,
  statementLinesByBankAccountId,
}: {
  accounts: TreasuryLiquidityAccount[];
  currentBalancesByAccountKey: Record<string, number>;
  latestReconciliationsByBankAccountId: Record<string, BankReconciliationRecord>;
  statementLinesByBankAccountId: Record<string, BankStatementLine[]>;
}) =>
  buildCsv(
    accounts.map((account) => {
      const statementLines =
        account.kind === 'bank'
          ? statementLinesByBankAccountId[account.id] ?? []
          : [];
      const latestReconciliation =
        account.kind === 'bank'
          ? latestReconciliationsByBankAccountId[account.id] ?? null
          : null;

      return {
        accountKind: account.kind,
        accountName: account.label,
        currentBalance:
          currentBalancesByAccountKey[account.key] ?? account.openingBalance,
        currency: account.currency,
        institutionOrLocation:
          account.kind === 'bank'
            ? account.institutionName || ''
            : account.location || '',
        latestReconciliationDate: formatDate(
          latestReconciliation?.statementDate ?? null,
        ),
        latestVariance: latestReconciliation?.variance ?? '',
        pendingStatementLines: statementLines.filter(
          (line) => line.status === 'pending',
        ).length,
        reconciledStatementLines: statementLines.filter(
          (line) => line.status === 'reconciled',
        ).length,
        status: account.status,
        totalStatementLines: statementLines.length,
        writtenOffStatementLines: statementLines.filter(
          (line) => line.status === 'written_off',
        ).length,
      };
    }),
  );

export const buildLiquidityLedgerCsv = ({
  account,
  entries,
}: {
  account: TreasuryLiquidityAccount;
  entries: LiquidityLedgerEntry[];
}) =>
  buildCsv(
    entries.map((entry) => ({
      account: account.label,
      accountKind: account.kind,
      amountSigned: formatSignedAmount({
        amount: entry.amount,
        direction: entry.direction,
      }),
      createdAt: formatDate(entry.createdAt ?? null),
      currency: entry.currency,
      description: entry.description ?? '',
      direction: entry.direction,
      occurredAt: formatDate(entry.occurredAt),
      reconciliationStatus: entry.reconciliationStatus ?? '',
      reference: entry.reference ?? '',
      sourceId: entry.sourceId ?? '',
      sourceType: entry.sourceType,
      status: entry.status ?? '',
    })),
  );

export const buildBankStatementLinesCsv = ({
  account,
  statementLines,
}: {
  account: TreasuryLiquidityAccount;
  statementLines: BankStatementLine[];
}) =>
  buildCsv(
    statementLines.map((line) => ({
      account: account.label,
      amountSigned: formatSignedAmount({
        amount: Number(line.amount ?? 0),
        direction: line.direction === 'out' ? 'out' : 'in',
      }),
      createdAt: formatDate(line.createdAt ?? null),
      description: line.description ?? '',
      direction: line.direction ?? '',
      lineType: line.lineType,
      reference: line.reference ?? '',
      statementDate: formatDate(line.statementDate),
      status: line.status,
    })),
  );

export const buildTreasuryExportFileName = ({
  prefix,
  suffix,
}: {
  prefix: string;
  suffix?: string | null;
}) => {
  const normalizedSuffix = suffix ? `-${slugify(suffix)}` : '';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slugify(prefix)}${normalizedSuffix}-${stamp}.csv`;
};
