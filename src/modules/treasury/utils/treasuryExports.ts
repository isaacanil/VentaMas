import type {
  BankReconciliationRecord,
  BankStatementLine,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import { formatDateTimeIso } from '@/modules/treasury/utils/formatters';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { buildCsvFromRecords } from '@/utils/export/csv';

export { downloadCsvFile } from '@/utils/export/csv';

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

export const buildTreasuryCockpitCsv = ({
  accounts,
  currentBalancesByAccountKey,
  latestReconciliationsByBankAccountId,
  statementLinesByBankAccountId,
}: {
  accounts: TreasuryLiquidityAccount[];
  currentBalancesByAccountKey: Record<string, number>;
  latestReconciliationsByBankAccountId: Record<
    string,
    BankReconciliationRecord
  >;
  statementLinesByBankAccountId: Record<string, BankStatementLine[]>;
}) =>
  buildCsvFromRecords(
    accounts.map((account) => {
      const statementLines =
        account.kind === 'bank'
          ? (statementLinesByBankAccountId[account.id] ?? [])
          : [];
      const latestReconciliation =
        account.kind === 'bank'
          ? (latestReconciliationsByBankAccountId[account.id] ?? null)
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
        latestReconciliationDate: formatDateTimeIso(
          latestReconciliation?.statementDate ?? null,
        ),
        latestReconciliationPeriodEnd: formatDateTimeIso(
          latestReconciliation?.periodEnd ??
            latestReconciliation?.statementDate ??
            null,
        ),
        latestReconciliationPeriodStart: formatDateTimeIso(
          latestReconciliation?.periodStart ?? null,
        ),
        latestStatementMovementTotal:
          latestReconciliation?.statementMovementTotal ?? '',
        latestVariance: latestReconciliation?.variance ?? '',
        latestLedgerPeriodMovementTotal:
          latestReconciliation?.ledgerPeriodMovementTotal ?? '',
        latestOpeningVariance: latestReconciliation?.openingVariance ?? '',
        latestPeriodVariance: latestReconciliation?.periodVariance ?? '',
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
  buildCsvFromRecords(
    entries.map((entry) => ({
      account: account.label,
      accountKind: account.kind,
      amountSigned: formatSignedAmount({
        amount: entry.amount,
        direction: entry.direction,
      }),
      createdAt: formatDateTimeIso(entry.createdAt ?? null),
      currency: entry.currency,
      description: entry.description ?? '',
      direction: entry.direction,
      occurredAt: formatDateTimeIso(entry.occurredAt),
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
  buildCsvFromRecords(
    statementLines.map((line) => ({
      account: account.label,
      amountSigned: formatSignedAmount({
        amount: Number(line.amount ?? 0),
        direction: line.direction === 'out' ? 'out' : 'in',
      }),
      createdAt: formatDateTimeIso(line.createdAt ?? null),
      description: line.description ?? '',
      direction: line.direction ?? '',
      lineType: line.lineType,
      reference: line.reference ?? '',
      statementDate: formatDateTimeIso(line.statementDate),
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
