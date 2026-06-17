import type {
  BankReconciliationRecord,
  InternalTransfer,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { toMillis } from '@/utils/firebase/toTimestamp';

export interface TreasuryActivityFeedItem {
  id: string;
  amount: number;
  date: unknown;
  kind: 'reconciliation' | 'transfer';
  note: string;
  tone: 'neutral' | 'success' | 'warning';
  title: string;
}

export const buildTreasuryActivityFeed = ({
  account,
  reconciliations,
  transfers,
}: {
  account: TreasuryLiquidityAccount;
  reconciliations: BankReconciliationRecord[];
  transfers: InternalTransfer[];
}) =>
  [
    ...transfers.map<TreasuryActivityFeedItem>((transfer) => ({
      id: `transfer:${transfer.id}`,
      amount: transfer.amount,
      date: transfer.occurredAt,
      kind: 'transfer',
      note: transfer.reference || transfer.notes || 'Transferencia interna',
      tone: 'neutral',
      title:
        transfer.fromAccountId === account.id &&
        transfer.fromAccountType === account.kind
          ? 'Transferencia saliente'
          : 'Transferencia entrante',
    })),
    ...reconciliations.map<TreasuryActivityFeedItem>((reconciliation) => ({
      id: `reconciliation:${reconciliation.id}`,
      amount: reconciliation.variance,
      date: reconciliation.statementDate,
      kind: 'reconciliation',
      note:
        reconciliation.variance === 0
          ? 'Sin diferencia contra ledger'
          : 'Requiere revisar variación',
      tone: reconciliation.status === 'balanced' ? 'success' : 'warning',
      title:
        reconciliation.status === 'balanced'
          ? 'Conciliación cuadrada'
          : 'Conciliación con variación',
    })),
  ].sort((left, right) => {
    const rightMs = toMillis(right.date as never) ?? 0;
    const leftMs = toMillis(left.date as never) ?? 0;
    return rightMs - leftMs;
  });

export const getLedgerTotals = (entries: LiquidityLedgerEntry[]) =>
  entries.reduce(
    (accumulator, entry) => {
      const amount = Number(entry.amount ?? 0);
      if (entry.direction === 'out') {
        accumulator.outflow += amount;
      } else {
        accumulator.inflow += amount;
      }
      return accumulator;
    },
    { inflow: 0, outflow: 0 },
  );
