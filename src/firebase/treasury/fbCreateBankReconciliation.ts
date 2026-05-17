import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

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

export const fbCreateBankReconciliation = async (
  input: CreateBankReconciliationInput,
): Promise<CreateBankReconciliationResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    CreateBankReconciliationInput & { sessionToken?: string },
    CreateBankReconciliationResult
  >(functions, 'createBankReconciliation');

  const response = await callable({
    ...input,
    reference: toCleanString(input.reference),
    note: toCleanString(input.note),
    periodStart:
      typeof input.periodStart === 'number' ? input.periodStart : null,
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo registrar la conciliación bancaria.');
  }

  return response.data;
};

export const fbPreviewBankReconciliation = async (
  input: PreviewBankReconciliationInput,
): Promise<PreviewBankReconciliationResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    PreviewBankReconciliationInput & { sessionToken?: string },
    PreviewBankReconciliationResult
  >(functions, 'previewBankReconciliation');

  const response = await callable({
    ...input,
    periodStart:
      typeof input.periodStart === 'number' ? input.periodStart : null,
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo previsualizar la conciliación bancaria.');
  }

  return response.data;
};
