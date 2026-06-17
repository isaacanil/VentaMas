import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

export interface CreateBankReconciliationInput {
  businessId: string;
  bankAccountId: string;
  openingStatementBalance: number;
  periodStart: number;
  statementBalance: number;
  statementDate: number;
  reference?: string | null;
  note?: string | null;
  idempotencyKey: string;
}

export interface CreateBankReconciliationResult {
  ok: boolean;
  reused?: boolean;
  reconciliationId: string;
  reconciliation: Record<string, unknown>;
}

export interface PreviewBankReconciliationInput {
  businessId: string;
  bankAccountId: string;
  openingStatementBalance: number;
  periodStart: number;
  statementBalance: number;
  statementDate: number;
}

export interface PreviewBankReconciliationResult {
  ok: boolean;
  preview: {
    bankAccountId: string;
    carriedMovementCount: number;
    ledgerBalance: number;
    ledgerOpeningBalance: number;
    ledgerPeriodMovementTotal: number;
    openingStatementBalance: number;
    openingVariance: number;
    periodEnd: number | null;
    periodMovementCount: number;
    periodStart: number | null;
    periodVariance: number;
    reconciledMovementCount: number;
    referenceDate: number | null;
    statementBalance: number;
    statementDate: number | null;
    statementMovementTotal: number;
    status: 'balanced' | 'variance';
    unreconciledMovementCount: number;
    variance: number;
  };
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const createBankReconciliationCallable = createFirebaseCallable<
  CreateBankReconciliationInput & { sessionToken?: string },
  CreateBankReconciliationResult
>('createBankReconciliation');

const previewBankReconciliationCallable = createFirebaseCallable<
  PreviewBankReconciliationInput & { sessionToken?: string },
  PreviewBankReconciliationResult
>('previewBankReconciliation');

export const fbCreateBankReconciliation = async (
  input: CreateBankReconciliationInput,
): Promise<CreateBankReconciliationResult> => {
  const { sessionToken } = getStoredSession();

  const response = await createBankReconciliationCallable({
    ...input,
    reference: toCleanString(input.reference),
    note: toCleanString(input.note),
    periodStart:
      typeof input.periodStart === 'number' ? input.periodStart : null,
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response?.ok) {
    throw new Error('No se pudo registrar la conciliación bancaria.');
  }

  return response;
};

export const fbPreviewBankReconciliation = async (
  input: PreviewBankReconciliationInput,
): Promise<PreviewBankReconciliationResult> => {
  const { sessionToken } = getStoredSession();

  const response = await previewBankReconciliationCallable({
    ...input,
    periodStart:
      typeof input.periodStart === 'number' ? input.periodStart : null,
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response?.ok) {
    throw new Error('No se pudo previsualizar la conciliación bancaria.');
  }

  return response;
};
