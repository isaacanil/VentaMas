import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

interface TreasuryLedgerInput {
  type: 'cash' | 'bank';
  cashAccountId?: string | null;
  cashCountId?: string | null;
  bankAccountId?: string | null;
}

export interface CreateInternalTransferInput {
  allowOverdraft?: boolean;
  businessId: string;
  amount: number;
  currency: SupportedDocumentCurrency;
  reference?: string | null;
  note?: string | null;
  occurredAt?: number | null;
  idempotencyKey: string;
  from: TreasuryLedgerInput;
  to: TreasuryLedgerInput;
}

export interface CreateInternalTransferResult {
  ok: boolean;
  reused?: boolean;
  businessId: string;
  transfer: Record<string, unknown>;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeLedger = (
  ledger: TreasuryLedgerInput,
): TreasuryLedgerInput => ({
  type: ledger.type,
  cashAccountId: toCleanString(ledger.cashAccountId),
  cashCountId: toCleanString(ledger.cashCountId),
  bankAccountId: toCleanString(ledger.bankAccountId),
});

const createInternalTransferCallable = createFirebaseCallable<
  CreateInternalTransferInput & { sessionToken?: string },
  CreateInternalTransferResult
>('createInternalTransfer');

export const fbCreateInternalTransfer = async (
  input: CreateInternalTransferInput,
): Promise<CreateInternalTransferResult> => {
  const { sessionToken } = getStoredSession();

  const response = await createInternalTransferCallable({
    ...input,
    allowOverdraft: input.allowOverdraft === true,
    from: normalizeLedger(input.from),
    to: normalizeLedger(input.to),
    reference: toCleanString(input.reference),
    note: toCleanString(input.note),
    occurredAt: typeof input.occurredAt === 'number' ? input.occurredAt : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response?.ok) {
    throw new Error('No se pudo registrar la transferencia interna.');
  }

  return response;
};
