import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export interface CreateBankReconciliationInput {
  businessId: string;
  bankAccountId: string;
  statementBalance: number;
  statementDate?: number | null;
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
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo registrar la conciliación bancaria.');
  }

  return response.data;
};
