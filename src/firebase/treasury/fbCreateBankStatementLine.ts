import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export interface CreateBankStatementLineInput {
  amount: number;
  bankAccountId: string;
  businessId: string;
  description?: string | null;
  direction: 'in' | 'out';
  idempotencyKey: string;
  movementIds?: string[];
  reference?: string | null;
  statementDate?: number | null;
}

export interface CreateBankStatementLineResult {
  exactMatch: boolean;
  matchStatus: 'reconciled' | 'pending';
  matchedAmount: number;
  ok: boolean;
  reused?: boolean;
  statementLineId: string;
  statementLine: Record<string, unknown>;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const fbCreateBankStatementLine = async (
  input: CreateBankStatementLineInput,
): Promise<CreateBankStatementLineResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    CreateBankStatementLineInput & { sessionToken?: string },
    CreateBankStatementLineResult
  >(functions, 'createBankStatementLine');

  const response = await callable({
    ...input,
    description: toCleanString(input.description),
    movementIds: Array.isArray(input.movementIds) ? input.movementIds : [],
    reference: toCleanString(input.reference),
    statementDate:
      typeof input.statementDate === 'number' ? input.statementDate : null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo registrar la línea de extracto bancario.');
  }

  return response.data;
};
